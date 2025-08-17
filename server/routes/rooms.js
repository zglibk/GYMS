import express from 'express';
import database from '../config/database.js';
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
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 添加筛选条件
    if (floor) {
      whereClause += ' AND floor_number = ?';
      params.push(parseInt(floor));
    }
    
    if (roomType) {
      whereClause += ' AND room_type = ?';
      params.push(roomType);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM rooms ${whereClause}`;
    const countResult = await database.query(countQuery, params);
    const total = countResult[0].total;

    // 获取分页数据
    const dataQuery = `
      SELECT * FROM rooms
      ${whereClause}
      ORDER BY floor_number, room_number
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, pageSizeNum, offset];
    const rooms = await database.query(dataQuery, dataParams);

    res.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum)
        }
      }
    });
  } catch (error) {
    console.error('获取房间列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取房间列表失败'
    });
  }
});

/**
 * 根据ID获取房间详情
 * GET /api/rooms/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await database.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    if (room.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    res.json({
      success: true,
      data: room[0]
    });
  } catch (error) {
    console.error('获取房间详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取房间详情失败'
    });
  }
});

/**
 * 创建新房间
 * POST /api/rooms
 */
router.post('/', auth, async (req, res) => {
  try {
    const { room_number, floor_number, room_type, status = '空闲', remarks } = req.body;

    if (!room_number || !floor_number || !room_type) {
      return res.status(400).json({
        success: false,
        message: '房号、楼层和房间类型不能为空'
      });
    }

    // 检查房号是否已存在
    const existingRoom = await database.query(
      'SELECT id FROM rooms WHERE room_number = ?',
      [room_number]
    );

    if (existingRoom.length > 0) {
      return res.status(400).json({
        success: false,
        message: '房号已存在'
      });
    }

    // 创建房间
    await database.query(
      `INSERT INTO rooms (room_number, floor_number, room_type, status, remarks) 
       VALUES (?, ?, ?, ?, ?)`,
      [room_number, floor_number, room_type, status, remarks]
    );

    // 获取新创建的房间信息
    const newRoom = await database.query(
      'SELECT * FROM rooms WHERE id = LAST_INSERT_ID()'
    );

    res.status(201).json({
      success: true,
      message: '房间创建成功',
      data: newRoom[0]
    });
  } catch (error) {
    console.error('创建房间错误:', error);
    res.status(500).json({
      success: false,
      message: '创建房间失败'
    });
  }
});

/**
 * 更新房间信息
 * PUT /api/rooms/:id
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, floor_number, room_type, status, remarks } = req.body;

    // 检查房间是否存在
    const existingRoom = await database.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    if (existingRoom.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    // 如果更新房号，检查新房号是否已被其他房间使用
    if (room_number && room_number !== existingRoom[0].room_number) {
      const duplicateRoom = await database.query(
        'SELECT id FROM rooms WHERE room_number = ? AND id != ?',
        [room_number, id]
      );

      if (duplicateRoom.length > 0) {
        return res.status(400).json({
          success: false,
          message: '房号已被其他房间使用'
        });
      }
    }

    // 更新房间信息
    await database.query(
      `UPDATE rooms SET 
       room_number = COALESCE(?, room_number),
       floor_number = COALESCE(?, floor_number),
       room_type = COALESCE(?, room_type),
       status = COALESCE(?, status),
       remarks = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [room_number, floor_number, room_type, status, remarks, id]
    );

    // 获取更新后的房间信息
    const updatedRoom = await database.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '房间信息更新成功',
      data: updatedRoom[0]
    });
  } catch (error) {
    console.error('更新房间错误:', error);
    res.status(500).json({
      success: false,
      message: '更新房间失败'
    });
  }
});

/**
 * 删除房间
 * DELETE /api/rooms/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查房间是否存在
    const existingRoom = await database.query(
      'SELECT * FROM rooms WHERE id = ?',
      [id]
    );

    if (existingRoom.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    // 删除房间
    await database.query('DELETE FROM rooms WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '房间删除成功'
    });
  } catch (error) {
    console.error('删除房间错误:', error);
    res.status(500).json({
      success: false,
      message: '删除房间失败'
    });
  }
});

/**
 * 获取楼层列表
 * GET /api/rooms/floors/list
 */
router.get('/floors/list', auth, async (req, res) => {
  try {
    const floors = await database.query(
      'SELECT DISTINCT floor_number FROM rooms ORDER BY floor_number'
    );

    res.json({
      success: true,
      data: floors.map(f => f.floor_number)
    });
  } catch (error) {
    console.error('获取楼层列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取楼层列表失败'
    });
  }
});

/**
 * 获取房间类型列表
 * GET /api/rooms/types/list
 */
router.get('/types/list', auth, async (req, res) => {
  try {
    const types = await database.query(
      'SELECT DISTINCT room_type FROM rooms ORDER BY room_type'
    );

    res.json({
      success: true,
      data: types.map(t => t.room_type)
    });
  } catch (error) {
    console.error('获取房间类型列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取房间类型列表失败'
    });
  }
});

export default router;