<template>
  <div class="header" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-content">
      <!-- 左侧Logo和导航 -->
      <div class="left-section">
        <div class="logo" @click="router.push('/')">
          <div class="tv-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <span class="logo-text">哔哩哔哩</span>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/anime" class="nav-item" active-class="active">番剧</router-link>
          <router-link to="/live" class="nav-item" active-class="active">直播</router-link>
        </div>
      </div>

      <!-- 中间搜索框 -->
      <div class="center-section">
        <SearchBar 
          @search="handleSearch" 
          v-model="searchText" 
          ref="searchBarRef"
        />
      </div>

      <!-- 右侧用户区域 -->
      <div class="right-section">
        <div class="user-info">
          <UserPopover v-if="isLogin" />
          <div v-else class="user-avatar" @click="showLoginDialog">
            <el-avatar :size="42" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          </div>
          <div class="user-icons">
            <el-icon><Message /></el-icon>
            <el-icon><Star /></el-icon>
            <el-icon><Collection /></el-icon>
            <el-icon><Clock /></el-icon>
          </div>
        </div>
        <div class="upload-section">
          <el-button class="upload-btn" type="primary">
            <el-icon class="camera-icon"><VideoCamera /></el-icon>
            <span class="btn-text">投稿</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加登录对话框组件 -->
  <LoginDialog :visible="loginDialogVisible" @update:visible="loginDialogVisible = $event" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import UserPopover from '@/components/user/UserPopover.vue'
import { useTokenStore } from '@/stores/token'
import useUserInfoStore  from '@/stores/userInfo'
import { getUserInfoService } from '@/api/user'
import { 
  VideoCamera, 
  Message, 
  Star, 
  Collection, 
  Clock,
  Monitor
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import eventBus from '@/utils/eventBus'
//路由
const router = useRouter()
const isScrolled = ref(false)

// 登录对话框显示状态
const loginDialogVisible = ref(false)

const tokenStore = useTokenStore()
const userInfoStore = useUserInfoStore()
const isLogin = computed(() => !!tokenStore.token)

// 获取用户信息
const getUserInfo = async () => {
  if (isLogin.value) {
    const res = await getUserInfoService()
    userInfoStore.setInfo(res.data)
  }
}

// 监听登录状态变化
watch(() => isLogin.value, (newVal) => {
  if (newVal) {
    getUserInfo()
  }
})

// 监听滚动事件
const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  eventBus.off('showLogin')
})

// 显示登录对话框
const showLoginDialog = () => {
  loginDialogVisible.value = true
}

// 监听显示登录弹窗事件
eventBus.on('showLogin', () => {
  loginDialogVisible.value = true
})

const searchText = ref('')
const searchBarRef = ref(null)

const handleSearch = () => {
  if (!searchText.value.trim()) return
  
  // 跳转到搜索页面
  router.push({
    path: '/search',
    query: {
      keyword: searchText.value.trim()
    }
  })
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.header-scrolled {
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 40px;
}

/* 左侧区域 */
.left-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: fit-content;
  margin-right: auto;
  padding-right: 20px;
}

/* 中间区域 */
.center-section {
  flex: 0 1 500px;
  min-width: 300px;
  margin-right: auto;
}

/* 右侧区域 */
.right-section {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  min-width: fit-content;
  margin-left: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 64px;
  flex-shrink: 0;
}

.user-avatar {
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
}

.user-icons {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 100%;
  flex-shrink: 0;
}

.user-icons .el-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-icons .el-icon:hover {
  color: #00aeec;
  background-color: #f1f2f3;
}

.upload-section {
  display: flex;
  align-items: center;
  height: 64px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: normal;
}

.message-badge :deep(.el-badge__content) {
  background-color: #fb7299;
  border: none;
  transform: translate(30%, -30%);
}

.camera-icon {
  font-size: 16px;
}

.btn-text {
  margin-left: 2px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.tv-icon {
  background-color: #fb7299;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv-icon .el-icon {
  font-size: 20px;
  color: white;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #18191c;
  font-family: "Microsoft YaHei", sans-serif;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.logo:hover .tv-icon {
  background-color: #fc8bab;
  transition: background-color 0.3s ease;
}

.logo:hover .logo-text {
  color: #fb7299;
  transition: color 0.3s ease;
}

.nav-links {
  display: flex;
  align-items: center;
  margin-left: 40px;
  gap: 30px;
}

.nav-item {
  font-size: 14px;
  color: #18191c;
  text-decoration: none;
  font-weight: 500;
  height: 64px;
  line-height: 64px;
  padding: 0 12px;
  position: relative;
  transition: all 0.3s ease;
}

.nav-item:hover {
  color: #fb7299;
}

.nav-item.active {
  color: #fb7299;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #fb7299;
}

.user-avatar:hover {
  transform: scale(1.05);
  background-color: #f1f2f3;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active) {
  border-bottom: 2px solid #fb7299;
  color: #fb7299;
  font-weight: bold;
}

:deep(.el-button--primary) {
  background-color: #fb7299;
  border-color: #fb7299;
  color: #fff;
}

:deep(.el-button--primary:hover) {
  background-color: #fc8bab;
  border-color: #fc8bab;
}

:deep(.el-avatar) {
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 添加响应式布局 */
@media screen and (max-width: 1200px) {
  .header-content {
    padding: 0 16px;
  }

  .nav-links {
    gap: 20px;
  }

  /* 在较窄屏幕下隐藏部分导航项 */
  .nav-links .nav-item:nth-last-child(n+3) {
    display: none;
  }
}

@media screen and (max-width: 900px) {
  .logo-text {
    display: none; /* 隐藏logo文字 */
  }

  .center-section {
    margin: 0 16px;
    min-width: 200px; /* 减小最小宽度 */
  }

  .user-icons {
    gap: 16px; /* 减小图标间距 */
  }
}

@media screen and (max-width: 768px) {
  .user-icons .el-icon:nth-last-child(-n+2) {
    display: none; /* 隐藏最后两个图标 */
  }
}
</style> 