# 技术规格说明书 (spec.md)

| 文档版本 | 日期 | 状态 | 作者 |
| :--- | :--- | :--- | :--- |
| v1.1.0 | 2024-05-20 | **正式确认 (Web 版)** | 架构师助手 |

---

## 1. 项目概览 (Project Overview)

**项目名称**：HomeKeep (家庭物品管理助手)  
**一句话总结**：一款基于 **Spring Boot + React Web** 的家庭共享物品管理应用，支持浏览器访问（含移动端 H5），帮助家庭成员协同记录全屋物品位置，快速查找，并及时补充消耗品。  
**核心价值**：
1.  **跨平台访问**：无需下载安装，通过链接即可在电脑、手机浏览器中使用，降低使用门槛。
2.  **查找效率**：解决“东西太多找不到”的问题，通过位置记录和搜索快速定位。
3.  **库存管理**：解决“用完忘补充”的问题，通过低量提醒机制。
4.  **家庭协作**：支持多成员实时同步，数据云端备份且支持 PWA 离线使用。

---

## 2. 用户流程 & UI 设计 (User Flow & UI Design)

### 2.1 核心用户流程
1.  **入驻流程**：访问网址 -> 手机号登录 -> 创建/加入家庭组 -> 进入首页。
2.  **录入流程**：点击添加按钮 -> 调用摄像头/上传照片 -> 输入名称 -> 选择位置 -> 设置数量/阈值 -> 保存。
3.  **查找流程**：顶部搜索框输入关键词 -> 展示匹配物品列表 -> 点击查看详情 (显示位置路径)。
4.  **消耗流程**：查看物品 -> 点击“减少数量” -> 若低于阈值 -> 触发提醒标记。
5.  **同步流程**：用户操作 -> 写入本地 IndexedDB -> 后台队列检测网络 -> 自动同步至云端 -> 推送给其他家庭成员。

### 2.2 页面结构与交互 (Responsive)
| 页面 | 核心元素 | 交互说明 (Desktop/Mobile) |
| :--- | :--- | :--- |
| **登录页** | 居中卡片、手机号输入、验证码按钮 | 桌面端居中显示，移动端全屏显示 |
| **首页** | 侧边导航 (桌面)/底部导航 (移动)、搜索栏、物品网格/列表 | 桌面端展示侧边栏分类，移动端展示底部 Tab；支持响应式网格布局 |
| **物品详情** | 图片预览、信息表单、操作按钮 | 桌面端模态框 (Modal) 展示，移动端全屏页面展示 |
| **家庭管理** | 成员表格、邀请链接/二维码 | 桌面端表格展示，移动端卡片列表展示 |
| **提醒中心** | 通知列表、一键标记已处理 | 顶部铃铛图标入口，点击弹出下拉列表或跳转页面 |

### 2.3 视觉风格 (Vibe)
*   **色调**：暖橙色 (`#FF8C42`) 为主色，米白色 (`#F9F7F2`) 为背景。
*   **布局**：
    *   **Desktop**：左侧导航栏 + 顶部搜索 + 内容区域 (最大宽度 1200px 居中)。
    *   **Mobile**：底部 Tab 栏 + 顶部搜索 + 内容区域 (全屏)。
*   **形状**：卡片圆角 `12px`，按钮圆角 `6px`。
*   **反馈**：操作成功使用 Toast 提示，加载状态使用 Skeleton 屏。
*   **PWA 支持**：支持添加到桌面，隐藏浏览器地址栏，提供近似原生 App 的体验。

---

## 3. 技术栈 (Tech Stack)

### 3.1 前端 (Web)
| 模块 | 技术选型 | 版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **框架** | React | 18.2+ | 主流 Web 框架，生态丰富 |
| **构建工具** | Vite | 5.0+ | 极速启动与构建 |
| **语言** | TypeScript | 5.0+ | 类型安全 |
| **样式方案** | Tailwind CSS | 3.4+ | 原子化 CSS，便于实现定制温馨风格 |
| **UI 组件** | Headless UI + Custom | - | 无样式组件库，完全自定义视觉风格 |
| **本地数据库** | Dexie.js | 4.0+ | IndexedDB 封装，支持离线存储与查询 |
| **状态管理** | Zustand | 4.x | 轻量级全局状态管理 |
| **服务端状态** | TanStack Query | 5.x | 处理服务器数据缓存、同步、重试 |
| **PWA/离线** | Vite PWA Plugin | - | Service Worker 配置，支持离线缓存 |
| **网络请求** | Axios | 1.x | HTTP 客户端 |

### 3.2 后端 (Server)
| 模块 | 技术选型 | 版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **核心框架** | Spring Boot | 3.2+ | 快速构建企业级 Java 应用 |
| **语言** | Java | 21 (LTS) | 长期支持版本，性能优异 |
| **安全认证** | Spring Security + JWT | - | 无状态认证，适合 Web/移动端 |
| **数据库** | MySQL | 8.0+ | 关系型数据存储，支持全文索引 |
| **缓存** | Redis | 7.0+ | 存储热点数据、短信验证码、在线状态 |
| **实时通信** | Spring WebSocket | - | 家庭组内数据变更实时推送 (STOMP 协议) |
| **任务调度** | Spring Schedule | - | 每日扫描低库存物品发送提醒 |
| **对象存储** | 阿里云 OSS | - | 存储物品图片，兼容 S3 协议 |
| **Web 推送** | 自定义 VAPID 服务 | - | 支持 Web Push API 发送通知 |

### 3.3 基础设施
*   **Web 服务器**：Nginx (反向代理、静态资源托管、SSL 终止)
*   **容器化**：Docker + Docker Compose
*   **CI/CD**：GitHub Actions (自动构建 Jar 包与 Frontend Dist)
*   **域名**：需备案域名 (国内访问) 并配置 HTTPS (PWA 必需)

---

## 4. 核心功能 & 逻辑 (Core Functions & Logic)

### 4.1 家庭共享与数据隔离
*   **逻辑**：所有业务数据表必须包含 `family_id` 字段。
*   **权限校验**：后端通过 AOP 或拦截器，从 JWT 中解析 `user_id` 和 `family_id`，强制校验请求资源是否属于当前用户所在的家庭组。
*   **邀请机制**：家庭组生成唯一的 `invite_code` (6 位字母数字) 或 邀请链接 (`https://homekeep.com/join?code=ABC`)。

### 4.2 离线同步机制 (Offline Sync - Web)
*   **策略**：离线优先 (Offline-First) + PWA。
*   **前端逻辑**：
    1.  所有写操作首先写入本地 Dexie.js (IndexedDB)。
    2.  创建一条 `sync_queue` 记录。
    3.  Service Worker 拦截请求，若离线则缓存请求，若联网则发送。
    4.  使用 `navigator.onLine` 监听网络状态变化，触发同步队列。
*   **冲突解决**：
    *   采用 **Last Write Wins (LWW)** 策略。
    *   每条数据记录 `updated_at` timestamp。
    *   后端更新时比对：若 `request.updated_at < server.updated_at`，则拒绝更新并返回最新数据给前端覆盖本地。

### 4.3 低量提醒逻辑
*   **触发条件**：物品表字段 `quantity <= min_quantity`。
*   **实现方式**：
    1.  **实时触发**：用户修改数量接口中，若触发阈值，标记 `is_alert = true`。
    2.  **定时扫描**：后端每日 09:00 执行 `@Scheduled` 任务。
*   **推送渠道**：
    1.  **Web Push**：若用户订阅了通知，发送浏览器通知 (需 HTTPS)。
    2.  **站内信**：首页提醒中心红点。
    3.  **邮件/短信** (可选)：针对紧急缺货，配置邮件通知。

### 4.4 搜索功能
*   **技术**：MySQL 全文索引 (FULLTEXT INDEX)。
*   **范围**：物品名称、描述、标签、位置路径。
*   **流程**：
    1.  前端优先搜索本地 Dexie.js (速度最快，支持离线)。
    2.  联网状态下，可可选触发云端搜索以获取最新数据。
    3.  后端 SQL 示例：`SELECT * FROM items WHERE MATCH(name, description) AGAINST(? IN BOOLEAN MODE)`。

### 4.5 图片上传 (Web 适配)
*   **实现**：`<input type="file" accept="image/*" capture="environment">` 支持移动端调用摄像头。
*   **优化**：前端使用 `browser-image-compression` 库在上传前压缩图片，减少流量消耗。

---

## 5. 数据结构 (Data Structure)

### 5.1 数据库 Schema (MySQL)

```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 家庭组表
CREATE TABLE families (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    owner_id BIGINT NOT NULL,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 家庭成员关联表
CREATE TABLE family_members (
    family_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('OWNER', 'MEMBER') DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (family_id, user_id)
);

-- 位置表 (树形结构)
CREATE TABLE locations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    family_id BIGINT NOT NULL,
    parent_id BIGINT DEFAULT NULL,
    name VARCHAR(50) NOT NULL,
    path VARCHAR(255),
    INDEX idx_family (family_id)
);

-- 物品表
CREATE TABLE items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    family_id BIGINT NOT NULL,
    creator_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    min_quantity INT DEFAULT 1,
    location_id BIGINT,
    category VARCHAR(50),
    cover_image_url VARCHAR(255),
    custom_fields JSON,
    is_alert BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_family (family_id),
    FULLTEXT INDEX idx_search (name, description, category)
);

-- Web 推送订阅表
CREATE TABLE push_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh VARCHAR(200) NOT NULL,
    auth VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);