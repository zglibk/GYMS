import express from 'express';
import database from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * 获取清洁记录列表
 * GET /api/cleaning
 * 支持分页和筛选
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, type, startDate, endDate, roomNumber } = req.query;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (type) {
            whereClause += ' AND cr.type = ?';
            params.push(type);
        }

        if (startDate) {
            whereClause += ' AND cr.date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND cr.date <= ?';
            params.push(endDate);
        }

        if (roomNumber) {
            whereClause += ' AND cr.room_numbers LIKE ?';
            params.push(`%${roomNumber}%`);
        }

        // 获取总数
        const countResult = await database.query(
            `SELECT COUNT(*) as total FROM cleaning_records cr ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // 获取分页数据
        const dataResult = await database.query(
            `SELECT cr.*, u.username as created_by_name
             FROM cleaning_records cr
             LEFT JOIN users u ON cr.created_by = u.id
             ${whereClause}
             ORDER BY cr.date DESC, cr.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );

        res.json({
            success: true,
            data: {
                records: dataResult,
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
            message: '获取清洁记录列表失败'
        });
    }
});

/**
 * 根据ID获取清洁记录详情
 * GET /api/cleaning/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await database.query(
            `SELECT cr.*, u.username as created_by_name
             FROM cleaning_records cr
             LEFT JOIN users u ON cr.created_by = u.id
             WHERE cr.id = ?`,
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: '清洁记录不存在'
            });
        }

        res.json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('获取清洁记录详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取清洁记录详情失败'
        });
    }
});

/**
 * 创建新的清洁记录
 * POST /api/cleaning
 */
router.post('/', async (req, res) => {
    try {
        const { type, date, room_numbers, room_count, unit_price, total_amount, remarks } = req.body;
        const created_by = req.user.id;

        if (!type || !date || !room_numbers || !room_count || !unit_price || !total_amount) {
            return res.status(400).json({
                success: false,
                message: '清洁类型、日期、房间号、房间数量、单价和总金额不能为空'
            });
        }

        // 创建清洁记录
        await database.query(
            `INSERT INTO cleaning_records (type, date, room_numbers, room_count, unit_price, total_amount, remarks, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [type, date, room_numbers, room_count, unit_price, total_amount, remarks, created_by]
        );

        // 获取新创建的记录
        const newRecord = await database.query(
            `SELECT cr.*, u.username as created_by_name
             FROM cleaning_records cr
             LEFT JOIN users u ON cr.created_by = u.id
             WHERE cr.id = LAST_INSERT_ID()`
        );

        res.status(201).json({
            success: true,
            message: '清洁记录创建成功',
            data: newRecord[0]
        });
    } catch (error) {
        console.error('创建清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '创建清洁记录失败'
        });
    }
});

/**
 * 更新清洁记录
 * PUT /api/cleaning/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, date, room_numbers, room_count, unit_price, total_amount, remarks } = req.body;

        // 检查记录是否存在
        const existingRecord = await database.query(
            'SELECT * FROM cleaning_records WHERE id = ?',
            [id]
        );

        if (existingRecord.length === 0) {
            return res.status(404).json({
                success: false,
                message: '清洁记录不存在'
            });
        }

        // 更新记录
        await database.query(
            `UPDATE cleaning_records SET 
             type = COALESCE(?, type),
             date = COALESCE(?, date),
             room_numbers = COALESCE(?, room_numbers),
             room_count = COALESCE(?, room_count),
             unit_price = COALESCE(?, unit_price),
             total_amount = COALESCE(?, total_amount),
             remarks = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [type, date, room_numbers, room_count, unit_price, total_amount, remarks, id]
        );

        // 获取更新后的记录
        const updatedRecord = await database.query(
            `SELECT cr.*, u.username as created_by_name
             FROM cleaning_records cr
             LEFT JOIN users u ON cr.created_by = u.id
             WHERE cr.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: '清洁记录更新成功',
            data: updatedRecord[0]
        });
    } catch (error) {
        console.error('更新清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '更新清洁记录失败'
        });
    }
});

/**
 * 删除清洁记录
 * DELETE /api/cleaning/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查记录是否存在
        const existingRecord = await database.query(
            'SELECT * FROM cleaning_records WHERE id = ?',
            [id]
        );

        if (existingRecord.length === 0) {
            return res.status(404).json({
                success: false,
                message: '清洁记录不存在'
            });
        }

        // 删除记录
        await database.query('DELETE FROM cleaning_records WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '清洁记录删除成功'
        });
    } catch (error) {
        console.error('删除清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '删除清洁记录失败'
        });
    }
});

/**
 * 批量删除清洁记录
 * DELETE /api/cleaning/batch/:ids
 */
router.delete('/batch/:ids', async (req, res) => {
    try {
        const { ids } = req.params;
        const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

        if (idArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: '无效的ID列表'
            });
        }

        // 创建占位符
        const placeholders = idArray.map(() => '?').join(',');
        
        // 删除记录
        const result = await database.query(
            `DELETE FROM cleaning_records WHERE id IN (${placeholders})`,
            idArray
        );

        res.json({
            success: true,
            message: `成功删除 ${idArray.length} 条清洁记录`
        });
    } catch (error) {
        console.error('批量删除清洁记录错误:', error);
        res.status(500).json({
            success: false,
            message: '批量删除清洁记录失败'
        });
    }
});

/**
 * 获取清洁统计信息
 * GET /api/cleaning/stats/summary
 * 支持时间范围查询参数：startDate, endDate
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        const params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            dateFilter = 'WHERE date >= ?';
            params.push(startDate);
        } else if (endDate) {
            dateFilter = 'WHERE date <= ?';
            params.push(endDate);
        }

        // 获取统计数据
        const [summaryStats, typeStats] = await Promise.all([
            // 汇总统计信息
            database.query(
                `SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT room_numbers) as total_rooms,
                    COALESCE(SUM(total_amount), 0) as total_amount,
                    COALESCE(AVG(unit_price), 0) as avg_unit_price
                 FROM cleaning_records ${dateFilter}`,
                params
            ),
            
            // 按房间类型统计（包含记录数和金额）
            database.query(
                `SELECT 
                    r.room_type as type,
                    COUNT(DISTINCT cr.id) as count,
                    COALESCE(SUM(cr.total_amount), 0) as amount
                 FROM cleaning_records cr
                 JOIN rooms r ON FIND_IN_SET(r.room_number, cr.room_numbers) > 0
                 ${dateFilter.replace('FROM cleaning_records', 'WHERE 1=1').replace('WHERE', 'AND')}
                 GROUP BY r.room_type
                 ORDER BY count DESC`,
                params
            )
        ]);

        // 构造返回数据结构
        const summary = summaryStats[0] || {
            total_records: 0,
            total_rooms: 0,
            total_amount: 0,
            avg_unit_price: 0
        };

        res.json({
            success: true,
            data: {
                summary,
                roomTypeStats: typeStats || []
            }
        });
    } catch (error) {
        console.error('获取清洁统计信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取清洁统计信息失败'
        });
    }
});

export default router;