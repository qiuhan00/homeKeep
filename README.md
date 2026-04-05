# HomeKeep - 家庭物品管理助手

<div align="center">

![HomeKeep Logo](https://img.shields.io/badge/HomeKeep-家庭物品管理-FF8C42?style=for-the-badge&labelColor=F9F7F2)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

*一款基于 Spring Boot + React 的家庭共享物品管理应用*

</div>

---

## 功能特性

### 核心功能
- **家庭共享** - 创建/加入家庭，多成员协同管理
- **物品管理** - 添加、编辑、删除物品，支持拍照上传
- **位置追踪** - 记录物品存放位置，快速查找
- **低量提醒** - 物品库存不足时自动提醒
- **过期提醒** - 支持设置有效期，提前预警即将过期物品
- **购物清单** - 一键生成采购清单，按分类显示

### 物品分类
- **分类管理** - 预定义分类（厨房、洗漱、食品、日用、药品、护肤、其他）
- **标签系统** - 自定义标签，方便筛选和查找
- **搜索功能** - 支持按名称、描述、分类、标签搜索

### 用户体验
- **响应式设计** - 桌面端/移动端均可使用
- **PWA 支持** - 可添加到桌面，离线使用
- **暖色主题** - 温馨的橙色系 UI 设计

---

## 技术栈

### 后端
| 技术 | 说明 |
|:---|:---|
| Spring Boot 3.2+ | 核心框架 |
| Java 21 | 编程语言 |
| Spring Security + JWT | 身份认证 |
| MySQL 8.0 | 数据库 |
| Redis 7.0 | 缓存 |
| Spring WebSocket | 实时推送 |

### 前端
| 技术 | 说明 |
|:---|:---|
| React 18 | UI 框架 |
| Vite 5.0 | 构建工具 |
| TypeScript 5.0 | 类型安全 |
| Tailwind CSS 3.4 | 样式方案 |
| TanStack Query | 服务端状态 |
| Zustand | 全局状态 |
| React Router 6 | 路由管理 |

---

## 项目结构

```
homekeep/
├── backend/                    # Spring Boot 后端
│   └── src/main/java/com/homekeep/
│       ├── controller/         # REST API 控制器
│       ├── service/           # 业务逻辑层
│       ├── repository/         # 数据访问层
│       ├── entity/             # JPA 实体
│       ├── dto/                # 数据传输对象
│       ├── config/             # 配置类
│       ├── security/           # 安全认证
│       └── websocket/          # WebSocket 处理
│
├── frontend/                   # React 前端
│   └── src/
│       ├── components/         # 可复用组件
│       ├── pages/              # 页面组件
│       ├── services/           # API 服务
│       ├── stores/             # Zustand 状态
│       └── types/              # TypeScript 类型
│
├── docker-compose.yml          # Docker 编排
├── Dockerfile                  # 后端镜像构建
└── README.md
```

---

## 快速开始

### 环境要求
- JDK 21+
- Node.js 18+
- MySQL 8.0+
- Redis 7.0+

### 1. 克隆项目
```bash
git clone <repository-url>
cd homekeep
```

### 2. 配置数据库

创建 MySQL 数据库：
```sql
CREATE DATABASE homekeep DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改后端配置文件 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/homekeep?useSSL=false&allowPublicKeyRetrieval=true&characterEncoding=utf8&useUnicode=true
    username: root
    password: your_password
```

### 3. 启动后端
```bash
cd backend
./mvnw spring-boot:run
# 或使用 Maven
mvn spring-boot:run
```

后端启动后自动创建数据表。

### 4. 启动前端
```bash
cd frontend
npm install
npm run dev
```

前端访问地址：http://localhost:5173

### 5. Docker 部署（推荐）

```bash
docker-compose up -d
```

- 前端：http://localhost:80
- 后端：http://localhost:8080
- MySQL：localhost:3306
- Redis：localhost:6379

---

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |

### 家庭
| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | /api/families | 创建家庭 |
| POST | /api/families/join | 加入家庭 |
| GET | /api/families | 获取用户家庭列表 |
| GET | /api/families/{id} | 获取家庭详情 |
| DELETE | /api/families/{id} | 删除家庭 |
| GET | /api/families/{id}/members | 获取成员列表 |
| PUT | /api/families/{id}/members/{userId}/permissions | 更新成员权限 |
| DELETE | /api/families/{id}/members/{userId} | 移除成员 |
| POST | /api/families/{id}/leave | 退出家庭 |

### 物品
| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | /api/families/{familyId}/items | 创建物品 |
| GET | /api/families/{familyId}/items | 获取物品列表 |
| GET | /api/families/{familyId}/items/{id} | 获取物品详情 |
| PUT | /api/families/{familyId}/items/{id} | 更新物品 |
| DELETE | /api/families/{familyId}/items/{id} | 删除物品 |
| GET | /api/families/{familyId}/items/search | 搜索物品 |
| GET | /api/families/{familyId}/items/low-stock | 获取低量物品 |
| GET | /api/families/{familyId}/items/expiring | 获取即将过期物品 |
| POST | /api/families/{familyId}/items/{id}/adjust | 调整数量 |

---

## 页面预览

### 首页
- 欢迎信息与家庭选择
- 快速操作入口（添加物品、管理家庭）
- 待补充物品列表
- 已用完物品列表
- 即将过期物品提醒

### 物品管理
- 物品网格/列表展示
- 分类筛选
- 搜索功能
- 批量删除

### 添加/编辑物品
- 名称、描述
- 数量、最低数量
- 分类、标签
- 存放位置
- 有效期、提前提醒天数
- 物品图片（支持拍照）

### 购物清单
- 按分类分组显示
- 勾选已购物品
- 一键复制清单

---

## 配置说明

### JWT 密钥
修改 `backend/src/main/resources/application.yml` 中的 JWT 密钥：
```yaml
jwt:
  secret: your-secret-key-at-least-32-characters
  expiration: 604800000  # 7 days
```

### CORS 配置
如需允许所有来源（开发环境）：
```yaml
spring:
  servlet:
    cors:
      allowed-origins: "*"
```

生产环境请指定具体域名。

---

## License

MIT License

---

## 致谢

- [Spring Boot](https://spring.io/projects/spring-boot) - 后端框架
- [React](https://react.dev/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [TanStack Query](https://tanstack.com/query) - 数据请求库
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
