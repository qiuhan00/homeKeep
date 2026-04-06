import ReactDOM from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import App from './App'
import './index.css'
import { setQueryClient } from './stores/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟内数据被视为新鲜
      gcTime: 1000 * 60 * 60 * 24, // 24小时缓存
      retry: 1,
      networkMode: 'offlineFirst', // 离线优先模式
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

// 注册 queryClient 到 authStore，以便 logout 时清除缓存
setQueryClient(queryClient);

// 持久化存储器 - 使用 localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'homekeep-query-cache',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
  >
    <App />
  </PersistQueryClientProvider>
)