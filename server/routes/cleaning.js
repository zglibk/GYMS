import express from 'express';
import database from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取清洁记录列表
router.get('/', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, type, startDate, endDate, roomNumber } = req.query;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE 1=1';
        const params = {};

        if (type) {
            whereClause += ' AND type = @type';
            params.type = type;
        }

        if (startDate) {
            whereClause += ' AND date >= @startDate';
            params.startDate = startDate;
        }

        if (endDate) {
            whereClause += ' AND date <= @endDate';
            params.endDate = endDate;
        }

        if (roomNumber) {
            whereClause += ' AND room_numbers LIKE @roomNumber';
            params.roomNumber = `%${roomNumber}%`;
        }

        // 获取总数
        const countResult = await database.query(
            `SELECT COUNT(*) as total FROM cleaning_records ${whereClause}`,
            params
        );
        const total = countResult.recordset[0].total;

        // 获取分页数据 (兼容SQL Server 2008R2)
        const dataResult = await database.query(
            `SELECT TOP (@pageSize) *
             FROM (
                 SELECT cr.*, u.username as created_by_name,
                        ROW_NUMBER() OVER (ORDER BY cr.date DESC, cr.created_at DESC) as rn
                 FROM cleaning_records cr
                 LEFT JOIN users u ON cr.created_by = u.id
                 ${whereClause}
             ) as subquery
             WHERE rn > @offset
             ORDER BY rn`,
            { ...params, offset, pageSize: parseInt(pageSize) }
        );

        res.json({
            success: true,
            data: {
                records: dataResult.recordset,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    } catch (error) {
        console.error('获取清洁记录列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取单个清洁记录
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await database.query(
            `SELECT cr.*, u.username as created_by_name
             FROM cleaning_records cr
             LEFT JOIN users u ON cr.created_by = u.id
             WHERE cr.id = @id`,
            { id }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('获取清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 创建清洁记录
router.post('/', async (req, res) => {
    try {
        const { date, type, roomNumbers, roomCount, unitPrice, totalAmount, remarks } = req.body;
        const userId = req.user.id;

        // 验证必填字段
        if (!date || !type || !roomNumbers || !roomCount || unitPrice === undefined || totalAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段'
            });
        }

        const roomNumbersStr = Array.isArray(roomNumbers) ? roomNumbers.join(',') : roomNumbers;

        const result = await database.query(
            `INSERT INTO cleaning_records (date, type, room_numbers, room_count, unit_price, total_amount, remarks, created_by)
             OUTPUT INSERTED.id
             VALUES (@date, @type, @roomNumbers, @roomCount, @unitPrice, @totalAmount, @remarks, @createdBy)`,
            {
                date,
                type,
                roomNumbers: roomNumbersStr,
                roomCount,
                unitPrice,
                totalAmount,
                remarks: remarks || '',
                createdBy: userId
            }
        );

        res.status(201).json({
            success: true,
            message: '清洁记录创建成功',
            data: { id: result.recordset[0].id }
        });
    } catch (error) {
        console.error('创建清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新清洁记录
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, type, roomNumbers, roomCount, unitPrice, totalAmount, remarks } = req.body;
        const userId = req.user.id;

        // 验证记录是否存在
        const existingRecord = await database.query(
            'SELECT id, created_by FROM cleaning_records WHERE id = @id',
            { id }
        );

        if (existingRecord.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }

        // 验证权限（只能修改自己创建的记录）
        if (existingRecord.recordset[0].created_by !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权限修改此记录'
            });
        }

        const roomNumbersStr = Array.isArray(roomNumbers) ? roomNumbers.join(',') : roomNumbers;

        await database.query(
            `UPDATE cleaning_records 
             SET date = @date, type = @type, room_numbers = @roomNumbers, 
                 room_count = @roomCount, unit_price = @unitPrice, 
                 total_amount = @totalAmount, remarks = @remarks, 
                 updated_at = GETDATE()
             WHERE id = @id`,
            {
                id,
                date,
                type,
                roomNumbers: roomNumbersStr,
                roomCount,
                unitPrice,
                totalAmount,
                remarks: remarks || ''
            }
        );

        res.json({
            success: true,
            message: '清洁记录更新成功'
        });
    } catch (error) {
        console.error('更新清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 删除清洁记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 验证记录是否存在
        const existingRecord = await database.query(
            'SELECT id, created_by FROM cleaning_records WHERE id = @id',
            { id }
        );

        if (existingRecord.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '记录不存在'
            });
        }

        // 验证权限（只能删除自己创建的记录）
        if (existingRecord.recordset[0].created_by !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权限删除此记录'
            });
        }

        await database.query('DELETE FROM cleaning_records WHERE id = @id', { id });

        res.json({
            success: true,
            message: '清洁记录删除成功'
        });
    } catch (error) {
        console.error('删除清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 批量删除清洁记录
router.delete('/batch/:ids', async (req, res) => {
    try {
        const { ids } = req.params;
        const userId = req.user.id;
        const idArray = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

        if (idArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: '无效的ID列表'
            });
        }

        // 验证所有记录都属于当前用户
        const existingRecords = await database.query(
            `SELECT id FROM cleaning_records WHERE id IN (${idArray.join(',')}) AND created_by = @userId`,
            { userId }
        );

        if (existingRecords.recordset.length !== idArray.length) {
            return res.status(403).json({
                success: false,
                message: '部分记录不存在或无权限删除'
            });
        }

        await database.query(
            `DELETE FROM cleaning_records WHERE id IN (${idArray.join(',')}) AND created_by = @userId`,
            { userId }
        );

        res.json({
            success: true,
            message: `成功删除 ${idArray.length} 条记录`
        });
    } catch (error) {
        console.error('批量删除清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取统计数据
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;
        
        let whereClause = 'WHERE created_by = @userId';
        const params = { userId };

        if (startDate) {
            whereClause += ' AND date >= @startDate';
            params.startDate = startDate;
        }

        if (endDate) {
            whereClause += ' AND date <= @endDate';
            params.endDate = endDate;
        }

        // 基础统计
        const basicStats = await database.query(
            `SELECT 
                COUNT(*) as totalRecords,
                SUM(room_count) as totalRooms,
                SUM(total_amount) as totalAmount,
                AVG(unit_price) as avgUnitPrice
             FROM cleaning_records ${whereClause}`,
            params
        );

        // 按类型统计
        const typeStats = await database.query(
            `SELECT 
                type,
                COUNT(*) as count,
                SUM(total_amount) as amount
             FROM cleaning_records ${whereClause}
             GROUP BY type
             ORDER BY count DESC`,
            params
        );

        const basic = basicStats.recordset[0];
        
        res.json({
            success: true,
            data: {
                summary: {
                    total_records: basic.totalRecords || 0,
                    total_rooms: basic.totalRooms || 0,
                    total_amount: basic.totalAmount || 0,
                    avg_unit_price: basic.avgUnitPrice || 0
                },
                typeStats: typeStats.recordset
            }
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

export default router;