import jwt from 'jsonwebtoken';
import database from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'apartment_cleaning_secret_key_2024';

// 生成JWT token
const generateToken = (userId, username) => {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// 验证JWT token中间件
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 验证用户是否存在
        const result = await database.query(
            'SELECT id, username, email FROM users WHERE id = @userId',
            { userId: decoded.userId }
        );

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            email: result.recordset[0].email
        };
        
        next();
    } catch (error) {
        console.error('Token验证错误:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '访问令牌已过期'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

export { generateToken, authenticateToken };