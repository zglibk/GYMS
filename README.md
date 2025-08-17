# 公寓房间清洁管理系统

一个用于管理公寓房间清洁记录的全栈Web应用系统，包含前端Vue3应用和后端Node.js API。

## 项目结构

```
Project/
├── client/                 # 前端Vue3应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── layouts/        # 布局组件
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # Pinia状态管理
│   │   ├── router/         # Vue Router路由配置
│   │   ├── utils/          # 工具函数
│   │   └── style.css       # 全局样式
│   ├── index.html          # HTML入口文件
│   ├── vite.config.js      # Vite配置
│   └── package.json        # 前端依赖
├── server/                 # 后端Node.js API
│   ├── config/             # 配置文件
│   ├── middleware/         # 中间件
│   ├── routes/             # API路由
│   ├── app.js              # 应用入口
│   ├── .env                # 环境变量
│   └── package.json        # 后端依赖
├── database/               # 数据库脚本
│   └── create_database.sql # 数据库创建脚本
└── README.md               # 项目说明
```

## 功能特性

### 前端功能
- 🔐 用户认证（登录/注册）
- 📊 数据概览仪表盘
- 📝 清洁记录管理（增删改查）
- 🔍 记录搜索和筛选
- 📱 响应式设计，支持移动端
- 📈 统计数据可视化
- 📤 数据导出（CSV格式）

### 后端功能
- 🔒 JWT身份认证
- 🛡️ 安全中间件（Helmet、CORS、速率限制）
- 📊 RESTful API设计
- 🗄️ MySQL数据库集成
- 📝 完整的CRUD操作
- 📈 统计数据API
- 🔍 分页和筛选支持

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **日期处理**: Day.js
- **图标**: Element Plus Icons

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL
- **身份认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **数据验证**: Joi
- **安全**: Helmet, CORS, express-rate-limit
- **日志**: Morgan
- **环境变量**: dotenv

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- MySQL 8.0 或更高版本

### 1. 克隆项目
```bash
git clone <repository-url>
cd Project
```

### 2. 数据库设置
1. 确保MySQL正在运行
2. 执行数据库创建脚本：
```sql
-- 在MySQL客户端中执行
-- database/create_mysql_database.sql
```

### 3. 后端设置
```bash
cd server
npm install

# 配置环境变量（已有.env文件）
# 根据需要修改数据库连接信息

# 启动开发服务器
npm run dev
```

### 4. 前端设置
```bash
cd client
npm install

# 启动开发服务器
npm run dev
```

### 5. 访问应用
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3000
- API文档: http://localhost:3000/api/docs
- 健康检查: http://localhost:3000/health

## API接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 清洁记录接口
- `GET /api/cleaning/` - 获取清洁记录列表
- `GET /api/cleaning/:id` - 获取单个清洁记录
- `POST /api/cleaning/` - 创建清洁记录
- `PUT /api/cleaning/:id` - 更新清洁记录
- `DELETE /api/cleaning/:id` - 删除清洁记录
- `DELETE /api/cleaning/batch/:ids` - 批量删除记录
- `GET /api/cleaning/stats/summary` - 获取统计数据

## 数据库表结构

### users 表
- `id` - 用户ID（主键）
- `username` - 用户名（唯一）
- `email` - 邮箱（唯一）
- `password` - 密码（加密）
- `created_at` - 创建时间
- `updated_at` - 更新时间

### cleaning_records 表
- `id` - 记录ID（主键）
- `date` - 清洁日期
- `type` - 清洁类型
- `room_numbers` - 房间号码
- `room_count` - 房间数量
- `unit_price` - 单价
- `total_amount` - 总金额
- `remarks` - 备注
- `created_by` - 创建人ID（外键）
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 开发指南

### 前端开发
1. 组件开发遵循Vue 3 Composition API
2. 使用Pinia进行状态管理
3. 遵循Element Plus设计规范
4. 响应式设计，移动端优先

### 后端开发
1. 遵循RESTful API设计原则
2. 使用中间件进行认证和验证
3. 错误处理统一格式
4. 数据库操作使用参数化查询

### 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 提交前进行代码检查

## 部署

### 生产环境部署
1. 构建前端应用：
```bash
cd client
npm run build
```

2. 配置生产环境变量
3. 启动后端服务：
```bash
cd server
npm start
```

### 环境变量配置
```env
# 生产环境示例
NODE_ENV=production
PORT=3000
JWT_SECRET=your_production_secret
DB_SERVER=your_db_server
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
CORS_ORIGIN=https://your-frontend-domain.com
```

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查MySQL是否运行
   - 验证连接字符串和凭据
   - 确认防火墙设置

2. **前端无法连接后端**
   - 检查后端服务是否启动
   - 验证CORS配置
   - 检查端口是否被占用

3. **认证失败**
   - 检查JWT密钥配置
   - 验证token是否过期
   - 确认用户权限

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。

---

**注意**: 这是一个演示项目，生产环境使用前请确保进行充分的安全性测试和性能优化。