import express from 'express';
import sql from 'mssql';
import { authenticateToken as auth } from '../middleware/auth.js';
const router = express.Router();

/**
 * 获取所有房号列表
 * GET /api/rooms
 * 支持分页和筛选
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, floor, roomType, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const request = new sql.Request();
    
    // 添加筛选条件
    if (floor) {
      whereClause += ' AND floor_number = @floor';
      request.input('floor', sql.Int, parseInt(floor));
    }
    
    if (roomType) {
      whereClause += ' AND room_type = @roomType';
      request.input('roomType', sql.NVarChar, roomType);
    }
    
    if (status) {
      whereClause += ' AND status = @status';
      request.input('status', sql.NVarChar, status);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM rooms ${whereClause}`;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    // 获取分页数据 - 使用兼容SQL Server 2008R2的分页方式
    request.input('pageSize', sql.Int, parseInt(pageSize));
    request.input('offset', sql.Int, offset);
    
    const dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY floor_number, room_number) as rn
        FROM rooms
        ${whereClause}
      ) subquery
      WHERE rn > @offset AND rn <= (@offset + @pageSize)
      ORDER BY floor_number, room_number
    `;
    
    const dataResult = await request.query(dataQuery);
    
    res.json({
      success: true,
      data: {
        rooms: dataResult.recordset.map(room => ({
          id: room.id,
          room_number: room.room_number,
          floor_number: room.floor_number,
          room_type: room.room_type,
          status: room.status,
          remarks: room.remarks,
          created_at: room.created_at,
          updated_at: room.updated_at
        })),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          pages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取房号列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取房号列表失败',
      error: error.message
    });
  }
});

/**
 * 根据ID获取单个房号信息
 * GET /api/rooms/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('id', sql.Int, parseInt(id));
    
    const result = await request.query('SELECT * FROM rooms WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房号不存在'
      });
    }
    
    const room = result.recordset[0];
    res.json({
      success: true,
      data: {
        id: room.id,
        room_number: room.room_number,
        floor_number: room.floor_number,
        room_type: room.room_type,
        status: room.status,
        remarks: room.remarks,
        created_at: room.created_at,
        updated_at: room.updated_at
      }
    });
  } catch (error) {
    console.error('获取房号信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取房号信息失败',
      error: error.message
    });
  }
});

/**
 * 创建新房号
 * POST /api/rooms
 */
router.post('/', auth, async (req, res) => {
  try {
    const { room_number, floor_number, room_type, status = '可用', remarks } = req.body;
    
    // 验证必填字段
    if (!room_number || !floor_number || !room_type) {
      return res.status(400).json({
        success: false,
        message: '房号、楼层和房间类型为必填项'
      });
    }
    
    const request = new sql.Request();
    request.input('room_number', sql.NVarChar, room_number);
    request.input('floor_number', sql.Int, parseInt(floor_number));
    request.input('room_type', sql.NVarChar, room_type);
    request.input('status', sql.NVarChar, status);
    request.input('remarks', sql.NVarChar, remarks || null);
    
    const result = await request.query(`
      INSERT INTO rooms (room_number, floor_number, room_type, status, remarks)
      OUTPUT INSERTED.*
      VALUES (@room_number, @floor_number, @room_type, @status, @remarks)
    `);
    
    const newRoom = result.recordset[0];
    res.status(201).json({
      success: true,
      message: '房号创建成功',
      data: {
        id: newRoom.id,
        room_number: newRoom.room_number,
        floor_number: newRoom.floor_number,
        room_type: newRoom.room_type,
        status: newRoom.status,
        remarks: newRoom.remarks,
        created_at: newRoom.created_at,
        updated_at: newRoom.updated_at
      }
    });
  } catch (error) {
    console.error('创建房号失败:', error);
    if (error.number === 2627) { // 唯一约束违反
      res.status(400).json({
        success: false,
        message: '房号已存在'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '创建房号失败',
        error: error.message
      });
    }
  }
});

/**
 * 更新房号信息
 * PUT /api/rooms/:id
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, floor_number, room_type, status, remarks } = req.body;
    
    // 验证必填字段
    if (!room_number || !floor_number || !room_type) {
      return res.status(400).json({
        success: false,
        message: '房号、楼层和房间类型为必填项'
      });
    }
    
    const request = new sql.Request();
    request.input('id', sql.Int, parseInt(id));
    request.input('room_number', sql.NVarChar, room_number);
    request.input('floor_number', sql.Int, parseInt(floor_number));
    request.input('room_type', sql.NVarChar, room_type);
    request.input('status', sql.NVarChar, status || '可用');
    request.input('remarks', sql.NVarChar, remarks || null);
    
    const result = await request.query(`
      UPDATE rooms 
      SET room_number = @room_number,
          floor_number = @floor_number,
          room_type = @room_type,
          status = @status,
          remarks = @remarks,
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房号不存在'
      });
    }
    
    const updatedRoom = result.recordset[0];
    res.json({
      success: true,
      message: '房号更新成功',
      data: {
        id: updatedRoom.id,
        room_number: updatedRoom.room_number,
        floor_number: updatedRoom.floor_number,
        room_type: updatedRoom.room_type,
        status: updatedRoom.status,
        remarks: updatedRoom.remarks,
        created_at: updatedRoom.created_at,
        updated_at: updatedRoom.updated_at
      }
    });
  } catch (error) {
    console.error('更新房号失败:', error);
    if (error.number === 2627) { // 唯一约束违反
      res.status(400).json({
        success: false,
        message: '房号已存在'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '更新房号失败',
        error: error.message
      });
    }
  }
});

/**
 * 删除房号
 * DELETE /api/rooms/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const request = new sql.Request();
    request.input('id', sql.Int, parseInt(id));
    
    const result = await request.query('DELETE FROM rooms WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: '房号不存在'
      });
    }
    
    res.json({
      success: true,
      message: '房号删除成功'
    });
  } catch (error) {
    console.error('删除房号失败:', error);
    res.status(500).json({
      success: false,
      message: '删除房号失败',
      error: error.message
    });
  }
});

/**
 * 获取楼层列表
 * GET /api/rooms/floors/list
 */
router.get('/floors/list', auth, async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT DISTINCT floor_number 
      FROM rooms 
      ORDER BY floor_number
    `);
    
    res.json({
      success: true,
      data: result.recordset.map(row => row.floor_number)
    });
  } catch (error) {
    console.error('获取楼层列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取楼层列表失败',
      error: error.message
    });
  }
});

/**
 * 获取房间类型列表
 * GET /api/rooms/types/list
 */
router.get('/types/list', auth, async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT DISTINCT room_type 
      FROM rooms 
      ORDER BY room_type
    `);
    
    res.json({
      success: true,
      data: result.recordset.map(row => row.room_type)
    });
  } catch (error) {
    console.error('获取房间类型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取房间类型列表失败',
      error: error.message
    });
  }
});

export default router;