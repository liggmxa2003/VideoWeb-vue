<template>
  <div class="user-center">
    <!-- 顶部背景和用户信息 -->
    <div class="user-header">
      <div class="header-bg">
        <div class="bg-overlay"></div>
      </div>
      <div class="user-info-card">
        <div class="user-basic">
          <div class="avatar-wrap">
            <el-avatar :size="120" :src="userInfo.userPic || defaultAvatar"/>
            <div class="level-tag">LV6</div>
          </div>
          <div class="user-detail">
            <div class="name-row">
              <h1 class="username">{{ userInfo.nickname }}</h1>
              <el-button size="small" class="edit-btn" @click="goToEditProfile">
                <el-icon>
                  <Edit/>
                </el-icon>
                编辑资料
              </el-button>
            </div>
            <div class="user-id">账号: {{ userInfo.username }}</div>
            <div class="user-intro">个人简介：{{ userInfo.introduction || '这个人很懒什么都没写' }}</div>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-group">
            <div class="stat-item" v-for="stat in userStats" :key="stat.label">
              <div class="num">{{ stat.num }}</div>
              <div class="label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-wrap">
      <div class="content-main">
        <!-- 左侧导航 -->
        <div class="side-nav">
          <div class="nav-item"
               v-for="item in navItems"
               :key="item.name"
               :class="{ active: currentNav === item.name }"
               @click="handleNavClick(item)">
            <el-icon>
              <component :is="item.icon"></component>
            </el-icon>
            {{ item.label }}
            <span class="count" v-if="item.count">({{ item.count }})</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="main-content">
          <!-- 视频列表相关内容 -->
          <template v-if="currentNav === 'videos'">
            <user-video-content />
          </template>

          <!-- 编辑资料内容 -->
          <template v-if="currentNav === 'edit-profile'">
            <edit-profile-content />
          </template>

          <!-- 番剧管理内容 -->
          <template v-if="currentNav === 'anime'">
            <div v-if="!currentAnimeId">
              <anime-manage-content @select-anime="handleAnimeSelect" />
            </div>
            <div v-else>
              <anime-episode-manager 
                :anime-id="currentAnimeId" 
                @update="handleBackToAnimeList"
              />
            </div>
          </template>

          <!-- 其他导航内容的空状态 -->
          <div class="empty-state" v-if="currentNav !== 'videos' && currentNav !== 'edit-profile' && currentNav !== 'anime'">
            <el-empty :description="getEmptyText">
              <template #description>
                <p class="empty-text">{{ getEmptyText }}</p>
              </template>
            </el-empty>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {
  VideoCamera,
  Collection,
  Star,
  Edit,
  Document,
  ChatDotRound,
  MoreFilled,
  Delete,
  Plus,
  CircleCheckFilled,
  Film,
  Back
} from '@element-plus/icons-vue'
import useUserInfoStore from '@/stores/userInfo'
import {ElMessage, ElMessageBox} from "element-plus";
import {useTokenStore} from "@/stores/token";
import {deleteVideoService, editVideoService, getUserVideoService, publishVideoService} from "@/api/userVideo";
import {getUserInfoService} from "@/api/user/user";
import EditProfileContent from '@/components/user/EditUserInformation.vue'
import UserVideoContent from '@/components/user/UserVideoContent.vue'
import AnimeManageContent from '@/components/AnimeManageContent.vue'
import AnimeEpisodeManager from '@/components/anime/AnimeEpisodeManager.vue'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const currentNav = ref('videos')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
// token
const tokenStore = useTokenStore()

const userInfo = computed(() => userInfoStore.info)
const hasContent = computed(() => {
  return videos.value.length > 0;
});

const baseNavItems = [
  {name: 'videos', label: '视频', icon: 'VideoCamera', count: 0},
  {name: 'favorites', label: '收藏', icon: 'Collection', count: 0},
  {name: 'likes', label: '点赞', icon: 'Star', count: 0},
  {name: 'articles', label: '专栏', icon: 'Document', count: 0},
  {name: 'comments', label: '评论', icon: 'ChatDotRound', count: 0},
  {name: 'edit-profile', label: '编辑资料', icon: 'Edit'}
]

// 根据用户角色动态计算导航项
const navItems = computed(() => {
  if (userInfo.value?.role === 'admin') {
    // 在视频菜单后插入番剧管理菜单
    return [
      ...baseNavItems.slice(0, 1),
      {name: 'anime', label: '番剧管理', icon: 'Film', count: 0},
      ...baseNavItems.slice(1)
    ]
  }
  return baseNavItems
})

const userStats = [
  {num: 301, label: '关注'},
  {num: 4, label: '粉丝'},
  {num: 1, label: '获赞'},
  {num: 0, label: '播放量'}
]

const getEmptyText = computed(() => {
  const texts = {
    videos: '还没有发布过视频哦',
    anime: '还没有发布过番剧哦',
    favorites: '还没有收藏任何内容',
    likes: '还没有点赞过内容',
    articles: '还没有发布过专栏文章',
    comments: '还没有发表过评论'
  }
  return texts[currentNav.value]
})

const drawerVisible = ref(false)
const form = ref({
  title: '',
  cover: '',
  content: '',
  videoUrl: ''
})
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)

const openDrawer = () => {
  isEdit.value = false
  drawerVisible.value = true
}

const fileList = ref([])

const handleRemove = (file, fileList) => {
  form.value.cover = ''
  fileList.value = fileList
}

const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url || file.response?.data
  dialogVisible.value = true
}
//封面文件上传回调
const uploadSuccess = (result) => {
  form.value.cover = result.data;
  fileList.value = [{
    name: 'cover',
    url: result.data
  }]
}

const beforeCoverUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isJPGorPNG) {
    ElMessage.error('上传封面图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt10M) {
    ElMessage.error('上传封面图片大小不能超过 10MB!')
  }
  return isJPGorPNG && isLt2M
}

const submitForm = async () => {
  await publishVideoService(form.value)
  ElMessage.success('发布成功')
  currentEditId.value = {}
  //关闭抽屉
  drawerVisible.value = false
  //更新视频列表
  await getUserVideoInfo()
}

const resetForm = () => {
  form.value = {
    title: '',
    cover: '',
    content: '',
    videoUrl: ''
  }
  fileList.value = []
  videoFileName.value = ''
  isEdit.value = false
  currentEditId.value = null
}

const handleDrawerClose = () => {
  resetForm()
  drawerVisible.value = false
}

//视频区域数据模型
const videos = ref([]);
//分页相关的数据
const pagination = ref({
  pageNum: 1,
  pageSize: 5,
  total: 0
})

//获取用视频信息
const getUserVideoInfo = async () => {
  let result = await getUserVideoService({
    pageNum: pagination.value.pageNum,
    pageSize: pagination.value.pageSize
  });
  videos.value = result.data.items;
  pagination.value.total = result.data.total;
}

// 添加分页改变的处理方法
const handlePageChange = (newPage) => {
  pagination.value.pageNum = newPage;
  getUserVideoInfo();
}

const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  pagination.value.pageNum = 1;
  getUserVideoInfo();
}

// 处理下拉菜单命令
const handleCommand = async ({type, id}) => {
  if (type === 'edit') {
    const currentVideo = videos.value.find(video => video.id === id)
    if (currentVideo) {
      form.value = {
        title: currentVideo.title,
        cover: currentVideo.cover,
        content: currentVideo.content
      }
      fileList.value = [{
        name: 'cover',
        url: currentVideo.cover
      }]
      isEdit.value = true
      currentEditId.value = id
      drawerVisible.value = true
    }
  } else if (type === 'delete') {
    // 处理删除逻辑
    try {
      await ElMessageBox.confirm(
          '确定要删除这个视频吗？',
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
      )
      // TODO: 调用删除API
      console.log('删除视频:', id)
      await deleteVideoService(id)
      //刷新列表
      await getUserVideoInfo()
      await ElMessage.success('删除成功')
    } catch (error) {
      console.log('取消删除')
    }
  }
}
const handleExceed = (files) => {
  ElMessage.warning('只能上传一张封面图片')
}
// 更新视频信息
const updateVideo = async () => {
  await editVideoService({
    id: currentEditId.value,
    ...form.value
  })
  ElMessage.success('更新成功')
  //清除数据
  currentEditId.value = {}
  //关闭抽屉
  drawerVisible.value = false
  //更新视频列表
  await getUserVideoInfo()
}
// 获取用户视频信息
getUserVideoInfo()

// 添加新的响应式变量
const videoFileName = ref('')

// 视频上传成功回调
const handleVideoSuccess = (response) => {
  form.value.videoUrl = response.data
  videoFileName.value = response.originalFilename || '已上传视频'
}

// 视频上传前的验证
const beforeVideoUpload = (file) => {
  const isValidFormat = ['video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(file.type)
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isValidFormat) {
    ElMessage.error('请上传正确的视频格式!')
    return false
  }
  if (!isLt500M) {
    ElMessage.error('视频大小不能超过 500MB!')
    return false
  }
  return true
}

// 处理超出上传数量限制
const handleVideoExceed = () => {
  ElMessage.warning('只能上传一个视频文件')
}

// 移除视频
const removeVideo = () => {
  form.value.videoUrl = ''
  videoFileName.value = ''
}

// 添加跳转到编辑资料页面的方法
const goToEditProfile = () => {
  currentNav.value = 'edit-profile'
}

const handleNavClick = (item) => {
  currentNav.value = item.name
}

const currentAnimeId = ref(null)

const handleAnimeSelect = (animeId) => {
  currentAnimeId.value = animeId
}

const handleBackToAnimeList = () => {
  currentAnimeId.value = null
}

const handleEpisodeUpdate = () => {
  // Handle episode update logic here
}
</script>

<style scoped>
.user-center {
  min-height: 100vh;
  background-color: #f1f2f3;
}

.user-header {
  position: relative;
  height: 280px; /* 增加高度 */
  color: #18191c;
  margin-bottom: 20px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(to bottom, #f6f7f8, #fff);
}

.user-info-card {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px; /* 设置最小高度 */
}

.user-basic {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 0;
  position: relative;
  z-index: 2;
  padding-top: 20px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  margin-bottom: 0;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-wrap :deep(.el-avatar) {
  border: 4px solid #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.level-tag {
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6699;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-detail {
  flex: 1;
  min-width: 0;
  color: #18191c;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.username {
  font-size: 26px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  color: #18191c;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: 4px;
  background: #f4f5f7;
  border: 1px solid #e3e5e7;
  color: #61666d;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn:hover {
  background: #fb7299;
  border-color: #fb7299;
  color: #fff;
}

.edit-btn .el-icon {
  font-size: 14px;
}

.user-id {
  font-size: 18px;
  color: #61666d;
  margin-bottom: 11px;
}

.user-intro {
  font-size: 14px;
  color: #61666d;
  max-width: 600px;
  line-height: 1.5;
}

.user-stats {
  border-top: 1px solid #e3e5e7;
  padding-top: 16px;
  position: relative;
  z-index: 2;
  margin-top: 20px;
  margin-bottom: 20px; /* 增加底部间距 */
  text-align: center;
}

.stat-group {
  display: flex;
  gap: 60px;
  justify-content: center;
  padding-bottom: 16px;
}

.stat-item {
  text-align: center;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-in-out;
}

.stat-item .num {
  font-size: 22px;
  font-weight: bold;
  color: #18191c;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-item .label {
  font-size: 13px;
  color: #61666d;
  line-height: 1;
}

.content-area {
  background-color: #fff;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 1100px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.nav-tabs {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
}

.nav-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e3e5e7;
}

.nav-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e3e5e7;
}

.nav-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 24px;
  height: 46px;
  line-height: 46px;
  color: #61666d;
}

.nav-tabs :deep(.el-tabs__item.is-active) {
  color: #18191c;
  font-weight: bold;
}

.nav-tabs :deep(.el-tabs__active-bar) {
  background-color: #18191c;
}

.content-wrap {
  background: #fff;
  min-height: calc(100vh - 364px);
  width: 100%;
}

.content-main {
  width: 100%;
  max-width: 100%;
  padding: 20px;
  display: flex;
  gap: 24px;
  justify-content: flex-start;
}

.side-nav {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  position: sticky;
  top: 84px;
  align-self: flex-start;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  .el-icon {
    font-size: 18px; /* 增大图标尺寸 */
  }

  &:hover {
    background: #f6f7f8;
    color: #fb7299;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.active {
    background: #fff1f5;
    color: #fb7299;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .el-icon {
      color: #fb7299; /* 激活状态下图标颜色 */
    }
  }
}

.count {
  font-size: 12px;
  color: #999; /* 调整计数颜色以便于阅读 */
  margin-left: 4px;
}


.main-content {
  flex: 1;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  max-width: calc(100% - 224px); /* 200px侧边栏 + 24px间距 */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.empty-img {
  width: 200px;
  margin-bottom: 20px;
}

.empty-text {
  color: #666;
  font-size: 14px;
  margin: 16px 0;
}

:deep(.el-button--primary) {
  background: #fb7299;
  border-color: #fb7299;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary:hover) {
  background: #fc8bab;
  border-color: #fc8bab;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header {
    height: 200px;
  }

  .user-info-card {
    padding: 10px 20px;
  }

  .user-basic {
    gap: 16px;
  }

  .username {
    font-size: 20px;
  }

  .user-stats {
    padding-top: 12px;
    margin-top: 15px;
  }

  .stat-group {
    gap: 30px;
  }

  .stat-item .num {
    font-size: 18px;
  }

  .content-wrap {
    min-height: calc(100vh - 300px);
  }

  .content-main {
    flex-direction: column;
    padding: 12px;
  }

  .side-nav {
    width: 100%;
    position: static;
  }

  .main-content {
    max-width: 100%;
    min-height: 300px;
    padding: 16px;
  }

  .empty-img {
    width: 150px;
  }
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px;
}

.video-card {
  display: flex;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e3e5e7;
  height: 120px; /* 固定高度 */
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover-wrap {
  width: 200px; /* 固定宽度 */
  height: 120px; /* 固定高度 */
  flex-shrink: 0; /* 防止图片被压缩 */
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative; /* 添加相对定位 */
}

.video-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #18191c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 2;
  -moz-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  line-height: 1.4;
}

.video-description {
  font-size: 14px;
  color: #61666d;
  margin: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: -moz-box;
  display: box;
  -webkit-line-clamp: 2;
  -moz-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -moz-box-orient: vertical;
  box-orient: vertical;
  line-height: 1.4;
  max-height: 2.8em;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #9499a0;
}

.update-time, .view-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .video-card {
    height: 100px;
  }

  .video-cover-wrap {
    width: 160px;
    height: 100px;
  }

  .video-info {
    padding: 8px 12px;
  }

  .video-title {
    font-size: 14px;
  }

  .video-description {
    font-size: 12px;
    margin: 4px 0;
    line-height: 1.3;
    max-height: 2.6em;
  }
}

.button-container {
  display: flex;
  justify-content: flex-end; /* 右对齐 */
  margin-bottom: 20px; /* 添加底部间距 */
}

.video-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}

.action-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.3s;
}

.action-icon:hover {
  background-color: #f5f5f5;
  color: #fb7299;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

:deep(.el-dropdown-menu__item:hover) {
  color: #fb7299;
  background-color: #fff1f5;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 10px 0;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #fb7299;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #fb7299;
}

/* 添加新的样式 */
.video-uploader {
  width: 100%;
}

.video-upload-box {
  width: 100%;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.video-upload-box:hover {
  border-color: #fb7299;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.video-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.success-icon {
  color: #67c23a;
  font-size: 20px;
}

.file-name {
  color: #606266;
  font-size: 14px;
}

.remove-btn {
  margin-left: auto;
}

.cover-uploader :deep(.el-upload) {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #fb7299;
}

.cover-preview {
  width: 178px;
  height: 178px;
  object-fit: cover;
  display: block;
}
</style>
