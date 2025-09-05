<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">分析历史</h1>
        <p class="text-gray-600 mt-2">查看和管理您的情感分析历史记录</p>
      </div>

      <!-- 筛选器 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 情感筛选 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">情感倾向</label>
            <select v-model="filters.sentiment" class="select select-bordered w-full">
              <option value="">全部</option>
              <option value="positive">积极</option>
              <option value="negative">消极</option>
              <option value="neutral">中性</option>
            </select>
          </div>

          <!-- 开始日期 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
            <input 
              v-model="filters.start_date" 
              type="date" 
              class="input input-bordered w-full"
            />
          </div>

          <!-- 结束日期 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
            <input 
              v-model="filters.end_date" 
              type="date" 
              class="input input-bordered w-full"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-end gap-2">
            <button 
              @click="loadHistory" 
              class="btn btn-primary flex-1"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              {{ isLoading ? '搜索中...' : '搜索' }}
            </button>
            <button 
              @click="resetFilters" 
              class="btn btn-outline"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 历史记录列表 -->
      <div class="bg-white rounded-lg shadow-lg">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">历史记录</h2>
            <div class="text-sm text-gray-500">
              共 {{ pagination.total }} 条记录
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="p-12 text-center">
          <div class="loading loading-spinner loading-lg"></div>
          <p class="text-gray-500 mt-4">加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="historyRecords.length === 0" class="p-12 text-center">
          <div class="text-gray-400 text-6xl mb-4">📝</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无历史记录</h3>
          <p class="text-gray-500">开始您的第一次情感分析吧</p>
        </div>

        <!-- 记录列表 -->
        <div v-else class="divide-y divide-gray-200">
          <div 
            v-for="record in historyRecords" 
            :key="record.id" 
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- 记录基本信息 -->
                <div class="flex items-center gap-4 mb-3">
                  <span class="badge" :class="getAnalysisTypeBadgeColor(record.analysis_type)">
                    {{ record.analysis_type === 'single' ? '单条分析' : '批量分析' }}
                  </span>
                  <span class="badge" :class="getSentimentBadgeColor(record.sentiment)">
                    {{ getSentimentText(record.sentiment) }}
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ formatDate(record.created_at) }}
                  </span>
                </div>

                <!-- 内容预览 -->
                <div class="mb-3">
                  <div v-if="record.analysis_type === 'single'" class="text-gray-700">
                    <p class="line-clamp-2">{{ record.comment_text }}</p>
                  </div>
                  <div v-else class="text-gray-700">
                    <p class="font-medium">{{ record.file_name }}</p>
                    <p class="text-sm text-gray-500">
                      共分析 {{ record.total_count }} 条评论
                    </p>
                  </div>
                </div>

                <!-- 统计信息 -->
                <div class="flex items-center gap-6 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">置信度:</span>
                    <span class="font-medium">{{ (record.confidence * 100).toFixed(1) }}%</span>
                  </div>
                  <div v-if="record.analysis_type === 'batch'" class="flex items-center gap-4">
                    <span class="text-green-600">积极: {{ record.positive_count }}</span>
                    <span class="text-red-600">消极: {{ record.negative_count }}</span>
                    <span class="text-gray-600">中性: {{ record.neutral_count }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">关键词:</span>
                    <div class="flex gap-1">
                      <span 
                        v-for="keyword in record.keywords.slice(0, 3)" 
                        :key="keyword"
                        class="badge badge-outline badge-xs"
                      >
                        {{ keyword }}
                      </span>
                      <span v-if="record.keywords.length > 3" class="text-xs text-gray-400">
                        +{{ record.keywords.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center gap-2 ml-4">
                <button 
                  @click="viewDetail(record.id)" 
                  class="btn btn-sm btn-outline"
                >
                  查看详情
                </button>
                <button 
                  @click="confirmDelete(record)" 
                  class="btn btn-sm btn-error btn-outline"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.total > 0" class="p-6 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              显示第 {{ (pagination.page - 1) * pagination.page_size + 1 }} - 
              {{ Math.min(pagination.page * pagination.page_size, pagination.total) }} 条，
              共 {{ pagination.total }} 条记录
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="changePage(pagination.page - 1)" 
                :disabled="pagination.page <= 1 || isLoading"
                class="btn btn-sm btn-outline"
              >
                上一页
              </button>
              <span class="px-3 py-1 text-sm">
                {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.page_size) }}
              </span>
              <button 
                @click="changePage(pagination.page + 1)" 
                :disabled="pagination.page >= Math.ceil(pagination.total / pagination.page_size) || isLoading"
                class="btn btn-sm btn-outline"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">分析详情</h3>
          <button @click="showDetailModal = false" class="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="isLoadingDetail" class="flex justify-center items-center py-12">
          <div class="loading loading-spinner loading-lg"></div>
          <span class="ml-2">加载中...</span>
        </div>
        
        <!-- 详情内容 -->
        <div v-else-if="detailRecord" class="space-y-6">
          <!-- 基本信息 -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-3">基本信息</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-gray-500">分析类型:</span>
                <span class="ml-2 badge" :class="getAnalysisTypeBadgeColor(detailRecord.analysis_type)">
                  {{ detailRecord.analysis_type === 'single' ? '单条分析' : '批量分析' }}
                </span>
              </div>
              <div>
                <span class="text-sm text-gray-500">情感倾向:</span>
                <span class="ml-2 badge" :class="getSentimentBadgeColor(detailRecord.sentiment)">
                  {{ getSentimentText(detailRecord.sentiment) }}
                </span>
              </div>
              <div>
                <span class="text-sm text-gray-500">置信度:</span>
                <span class="ml-2 font-medium">{{ (detailRecord.confidence * 100).toFixed(1) }}%</span>
              </div>
              <div>
                <span class="text-sm text-gray-500">分析时间:</span>
                <span class="ml-2">{{ formatDate(detailRecord.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 单条分析内容 -->
          <div v-if="detailRecord.analysis_type === 'single'" class="bg-white border rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-3">分析内容</h4>
            <div class="bg-gray-50 p-3 rounded text-gray-700">
              {{ detailRecord.comment_text }}
            </div>
          </div>
          
          <!-- 批量分析信息 -->
          <div v-if="detailRecord.analysis_type === 'batch'" class="bg-white border rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-3">文件信息</h4>
            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-500">文件名:</span>
                <span class="ml-2 font-medium">{{ detailRecord.file_name }}</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div class="text-center p-3 bg-blue-50 rounded">
                  <div class="text-2xl font-bold text-blue-600">{{ detailRecord.total_count }}</div>
                  <div class="text-sm text-gray-600">总数</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded">
                  <div class="text-2xl font-bold text-green-600">{{ detailRecord.positive_count }}</div>
                  <div class="text-sm text-gray-600">积极</div>
                </div>
                <div class="text-center p-3 bg-red-50 rounded">
                  <div class="text-2xl font-bold text-red-600">{{ detailRecord.negative_count }}</div>
                  <div class="text-sm text-gray-600">消极</div>
                </div>
                <div class="text-center p-3 bg-yellow-50 rounded">
                  <div class="text-2xl font-bold text-yellow-600">{{ detailRecord.neutral_count }}</div>
                  <div class="text-sm text-gray-600">中性</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 关键词 -->
          <div v-if="detailRecord.keywords && detailRecord.keywords.length > 0" class="bg-white border rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-3">关键词</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="keyword in detailRecord.keywords" 
                :key="keyword"
                class="badge badge-outline"
              >
                {{ keyword }}
              </span>
            </div>
          </div>
          
          <!-- 详细数据 -->
          <div v-if="detailRecord.details && detailRecord.details.length > 0" class="bg-white border rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-3">详细数据</h4>
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>内容</th>
                    <th>情感</th>
                    <th>置信度</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(detail, index) in detailRecord.details.slice(0, 10)" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td class="max-w-xs truncate">{{ detail.comment_text || detail.content || '-' }}</td>
                    <td>
                      <span class="badge badge-sm" :class="getSentimentBadgeColor(detail.sentiment || detail.hzsystem_sentiment)">
                        {{ getSentimentText(detail.sentiment || detail.hzsystem_sentiment) }}
                      </span>
                    </td>
                    <td>{{ detail.confidence ? (detail.confidence * 100).toFixed(1) + '%' : '-' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="detailRecord.details.length > 10" class="text-center text-sm text-gray-500 mt-2">
                仅显示前10条，共{{ detailRecord.details.length }}条数据
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button @click="showDetailModal = false" class="btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认删除</h3>
        <p class="py-4">
          您确定要删除这条分析记录吗？此操作不可撤销。
        </p>
        <div v-if="recordToDelete" class="bg-gray-50 p-3 rounded mb-4">
          <div class="text-sm text-gray-600">
            <div class="font-medium">{{ recordToDelete.analysis_type === 'single' ? '单条分析' : '批量分析' }}</div>
            <div class="truncate">
              {{ recordToDelete.analysis_type === 'single' ? recordToDelete.comment_text : recordToDelete.file_name }}
            </div>
            <div class="text-xs text-gray-500">{{ formatDate(recordToDelete.created_at) }}</div>
          </div>
        </div>
        <div class="modal-action">
          <button @click="showDeleteModal = false" class="btn">取消</button>
          <button 
            @click="deleteRecord" 
            class="btn btn-error" 
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="loading loading-spinner loading-sm"></span>
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getHistory, deleteRecord as deleteRecordApi, getDetail } from '@/api/index'
import type { HistoryRecord, GetHistoryRequest } from '@/types/apis/PagesAPI_T'

// 响应式数据
const isLoading = ref(false)
const isDeleting = ref(false)
const isLoadingDetail = ref(false)
const showDeleteModal = ref(false)
const showDetailModal = ref(false)
const historyRecords = ref<HistoryRecord[]>([])
const recordToDelete = ref<HistoryRecord | null>(null)
const detailRecord = ref<HistoryRecord | null>(null)

// 筛选器
const filters = ref({
  sentiment: '', // 用于UI显示的情感筛选
  start_date: '',
  end_date: ''
})

// 分页信息
const pagination = ref({
  total: 0,
  page: 1,
  page_size: 10
})

// 加载历史记录
const loadHistory = async () => {
  try {
    isLoading.value = true
    
    // 构建请求参数
    const params: GetHistoryRequest = {
      page: pagination.value.page,
      page_size: pagination.value.page_size
    }
    
    // 注意：API使用hzsystem_sentiment字段，但UI使用sentiment
    if (filters.value.sentiment) {
      params.hzsystem_sentiment = filters.value.sentiment as 'negative' | 'positive' | 'neutral'
    }
    
    if (filters.value.start_date) {
      params.start_date = filters.value.start_date
    }
    
    if (filters.value.end_date) {
      params.end_date = filters.value.end_date
    }
    
    const response = await getHistory(params)
    
    if (response.code === 200) {
      historyRecords.value = response.data.records
      pagination.value = {
        total: response.data.total,
        page: response.data.page,
        page_size: response.data.page_size
      }
    } else {
      ElMessage.error(response.msg || '获取历史记录失败')
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 重置筛选器
const resetFilters = () => {
  filters.value = {
    sentiment: '',
    start_date: '',
    end_date: ''
  }
  pagination.value.page = 1
  loadHistory()
}

// 切换页面
const changePage = (page: number) => {
  if (page < 1 || page > Math.ceil(pagination.value.total / pagination.value.page_size)) {
    return
  }
  pagination.value.page = page
  loadHistory()
}

// 查看详情
const viewDetail = async (id: number) => {
  try {
    isLoadingDetail.value = true
    showDetailModal.value = true
    
    const response = await getDetail(id)
    
    if (response.code === 200) {
      detailRecord.value = response.data
    } else {
      ElMessage.error(response.msg || '获取详情失败')
      showDetailModal.value = false
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败，请稍后重试')
    showDetailModal.value = false
  } finally {
    isLoadingDetail.value = false
  }
}

// 确认删除
const confirmDelete = (record: HistoryRecord) => {
  recordToDelete.value = record
  showDeleteModal.value = true
}

// 删除记录
const deleteRecord = async () => {
  if (!recordToDelete.value) return
  
  try {
    isDeleting.value = true
    
    const response = await deleteRecordApi({ record_id: recordToDelete.value.id })
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      showDeleteModal.value = false
      recordToDelete.value = null
      
      // 重新加载当前页数据
      await loadHistory()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除记录失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

// 工具函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSentimentText = (sentiment: string) => {
  const sentimentMap: Record<string, string> = {
    positive: '积极',
    negative: '消极',
    neutral: '中性'
  }
  return sentimentMap[sentiment] || sentiment
}

const getSentimentBadgeColor = (sentiment: string) => {
  const colorMap: Record<string, string> = {
    positive: 'badge-success',
    negative: 'badge-error',
    neutral: 'badge-warning'
  }
  return colorMap[sentiment] || 'badge-ghost'
}

const getAnalysisTypeBadgeColor = (type: string) => {
  return type === 'single' ? 'badge-primary' : 'badge-secondary'
}

// 组件挂载时加载数据
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>