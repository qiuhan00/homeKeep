# HomeKeep 项目指南

## 项目概述

HomeKeep 是一款基于 Spring Boot + React 的家庭共享物品管理应用，帮助家庭成员协同管理全屋物品位置、追踪库存、及时补充消耗品。

**技术栈**：Spring Boot 3.2 (Java 21) + React 18 + TypeScript + Tailwind CSS + MySQL + Redis

---

## 目录结构

```
homekeep/
├── backend/                    # Spring Boot 后端
│   └── src/main/java/com/homekeep/
│       ├── controller/         # REST API 控制器
│       ├── service/           # 业务逻辑层
│       ├── repository/        # JPA 数据访问层
│       ├── entity/            # JPA 实体类
│       ├── dto/               # 数据传输对象
│       ├── config/            # 配置类（Security, Redis, WebSocket）
│       ├── security/          # JWT 认证
│       └── exception/         # 异常处理
│
├── frontend/                  # React 前端
│   └── src/
│       ├── components/         # 可复用组件（Modal, ConfirmModal, Layout, FAB 等）
│       ├── pages/             # 页面组件（HomePage, ItemsPage, ShoppingListPage 等）
│       ├── services/          # API 服务层（api.ts, item.ts, family.ts, auth.ts）
│       ├── stores/            # Zustand 状态管理（auth.ts, app.ts）
│       └── types/             # TypeScript 类型定义
│
├── docker-compose.yml         # Docker 编排
├── CLAUDE.md                  # 本文件
└── README.md                  # 项目说明文档
```

---

## 开发规范

### 后端（Java/Spring Boot）

**命名规范**：
- 实体类：`PascalCase`，如 `FamilyMember`
- Service/Repository：`PascalCase`，如 `ItemService`
- Controller：`PascalCase`，如 `ItemController`
- DTO：`PascalCase`，如 `ItemDTO`
- 字段：`camelCase`，如 `familyId`

**API 响应格式**：
```java
// 统一使用 ApiResponse<T> 包装
ApiResponse.success(data)
ApiResponse.success("操作成功", data)
ApiResponse.error("错误信息")
```

**权限校验**：
- 家庭资源通过 `validateFamilyAccess(familyId, user)` 校验
- 使用 `@AuthenticationPrincipal User user` 注入当前用户

**数据库**：
- JPA `ddl-auto: update`，开发环境自动同步实体变更
- 已有数据库使用 Flyway 迁移（尚未配置）

### 前端（React/TypeScript）

**组件规范**：
- 页面组件放在 `pages/` 目录
- 可复用组件放在 `components/` 目录
- 文件命名：`PascalCase.tsx`，如 `HomePage.tsx`

**状态管理**：
- 全局状态使用 Zustand（`stores/` 目录）
- 服务端状态使用 TanStack Query（`useQuery`, `useMutation`）
- 避免过度使用全局状态，优先使用 props

**API 调用模式**：
```typescript
// services/api.ts - Axios 实例配置
// services/item.ts - 物品相关 API
// services/family.ts - 家庭相关 API

// 使用示例
const { data } = useQuery({
  queryKey: ['items', familyId],
  queryFn: () => itemApi.getAll(familyId),
})
```

**样式规范**：
- **重要**：使用内联样式或普通 CSS 类，避免 Tailwind 自定义扩展类（如 `hover:shadow-warm`、`bg-warm-200`）导致构建错误
- 暖色系直接使用十六进制值：`#E07B39`（主橙）、`#FFECD4`（浅暖米）、`#9E4C21`（深棕橙）
- 组件样式参考 `index.css` 中定义的 `.btn-primary`、`.btn-secondary`、`.card`、`.input` 等

---

## 常用操作

### 启动项目

**后端**：
```bash
cd backend
mvn spring-boot:run
# 或编译后运行
mvn compile
java -jar target/homekeep-*.jar
```

**前端**：
```bash
cd frontend
npm install
npm run dev
```

### 重启服务（清理端口）

Windows：
```bash
netstat -ano | grep -E ":(5173|8080)" | awk '{print $5}' | xargs -I {} taskkill //F //PID {}
```

启动：
```bash
# 后端
cd backend && nohup mvn spring-boot:run -q > /dev/null 2>&1 &

# 前端
cd frontend && nohup npm run dev -- --host 0.0.0.0 --port 5173 > /dev/null 2>&1 &
```

### 数据库操作

```bash
mysql -u root -p123456 -e "TRUNCATE TABLE items;" homekeep
```

### 构建

```bash
# 前端
cd frontend && npm run build

# 后端
cd backend && mvn clean package -DskipTests
```

---

## 项目特性注意事项

### UI 样式
- 当前使用暖色主题，主色调 `#E07B39`
- 为避免 Tailwind 扩展类在生产构建中丢失，优先使用内联样式 `style={{ backgroundColor: '#FFECD4' }}`
- CSS 类只使用 Tailwind 内置类和 `index.css` 中定义的组件类（`.btn-primary`、`.card` 等）

### PWA
- 前端已配置 PWA，可添加到桌面
- Service Worker 配置在 `vite.config.ts`

### WebSocket
- 用于家庭内实时推送（如其他成员修改了物品）
- 使用 tabId 区分浏览器标签页，同一用户多标签不会互相踢出

### 图片上传
- 移动端支持调用摄像头拍照
- 后端 `/api/images/upload` 接收 multipart/form-data

---

## 关键文件

| 文件 | 说明 |
|:---|:---|
| `backend/src/main/resources/application.yml` | 后端配置（数据库、Redis、JWT） |
| `frontend/src/App.tsx` | 前端路由配置 |
| `frontend/src/stores/auth.ts` | 用户认证状态 |
| `frontend/src/services/api.ts` | Axios 实例配置 |
| `frontend/src/pages/HomePage.tsx` | 首页（待补充/已用完/即将过期展示） |
| `frontend/src/pages/ShoppingListPage.tsx` | 购物清单页 |
| `frontend/src/pages/ItemEditPage.tsx` | 添加/编辑物品页 |

---

## 常见问题

**Q: Tailwind 自定义类不生效？**
A: 使用内联样式替代。例如 `style={{ backgroundColor: '#FFECD4' }}` 替代 `bg-warm-200`。

**Q: 前端端口被占用？**
A: Vite 会自动切换到其他端口，或手动 kill 占用的进程。

**Q: 后端编译失败？**
A: 检查 JDK 版本（需要 21），清理后重新编译：`mvn clean compile`。
