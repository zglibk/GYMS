import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import cleaningRoutes from './routes/cleaning.js';
import roomsRoutes from './routes/rooms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/rooms', roomsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: '公寓房间清洁管理系统运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: '接口不存在' 
    });
});

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api`);
});

export default app;