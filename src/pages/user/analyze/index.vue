<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">金融情绪分析</h1>
        <p class="text-gray-600">输入文字或上传CSV文件进行情感分析</p>
      </div>

      <!-- 分析选项卡 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="tabs tabs-boxed mb-6">
          <a 
            class="tab" 
            :class="{ 'tab-active': activeTab === 'text' }"
            @click="activeTab = 'text'"
          >
            文字分析
          </a>
          <a 
            class="tab" 
            :class="{ 'tab-active': activeTab === 'file' }"
            @click="activeTab = 'file'"
          >
            文件分析
          </a>
        </div>

        <!-- 文字分析 -->
        <div v-if="activeTab === 'text'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              请输入要分析的文字内容
            </label>
            <textarea
              v-model="textInput"
              class="textarea textarea-bordered w-full h-32 resize-none"
              placeholder="请输入您想要分析的文字内容..."
            ></textarea>
          </div>
          <button
            @click="analyzeText"
            :disabled="!textInput.trim() || isAnalyzing"
            class="btn btn-primary w-full"
          >
            <span v-if="isAnalyzing" class="loading loading-spinner loading-sm"></span>
            {{ isAnalyzing ? '分析中...' : '开始分析' }}
          </button>
        </div>

        <!-- 文件分析 -->
        <div v-if="activeTab === 'file'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              上传CSV文件
            </label>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              @change="handleFileSelect"
              class="file-input file-input-bordered w-full"
            />
            <div class="text-sm text-gray-500 mt-2">
              支持CSV格式，文件大小不超过10MB
            </div>
          </div>
          <div v-if="selectedFile">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              评论列名（可选）
            </label>
            <input
              v-model="commentColumn"
              type="text"
              class="input input-bordered w-full"
              placeholder="默认为 comment"
            />
          </div>
          <button
            @click="analyzeFile"
            :disabled="!selectedFile || isAnalyzing"
            class="btn btn-primary w-full"
          >
            <span v-if="isAnalyzing" class="loading loading-spinner loading-sm"></span>
            {{ isAnalyzing ? '分析中...' : '开始分析' }}
          </button>
        </div>
      </div>

      <!-- 分析结果 -->
      <div v-if="analysisResult" class="bg-white rounded-lg shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">分析结果</h2>
          <button
            @click="showDeleteModal = true"
            class="btn btn-error btn-sm"
          >
            删除记录
          </button>
        </div>

        <!-- 单条分析结果 -->
        <div v-if="analysisResult.type === 'single'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">情感倾向</div>
              <div class="stat-value text-lg" :class="getSentimentColor(getSentimentValue(singleResult!))">
                {{ getSentimentText(getSentimentValue(singleResult!)) }}
              </div>
              <div class="stat-desc">置信度: {{ (singleResult!.confidence * 100).toFixed(1) }}%</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">分析时间</div>
              <div class="stat-value text-lg">{{ formatDate(singleResult!.created_at) }}</div>
            </div>
          </div>
          
          <div>
            <h3 class="font-medium text-gray-700 mb-2">关键词</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="keyword in singleResult!.keywords"
                :key="keyword"
                class="badge badge-outline"
              >
                {{ keyword }}
              </span>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-gray-700 mb-2">情感概率分布</h3>
            <div class="space-y-2">
              <div class="flex items-center">
                <span class="w-16 text-sm">积极:</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                  <div 
                    class="bg-green-500 h-2 rounded-full" 
                    :style="{ width: (singleResult!.probabilities.positive * 100) + '%' }"
                  ></div>
                </div>
                <span class="text-sm">{{ (singleResult!.probabilities.positive * 100).toFixed(1) }}%</span>
              </div>
              <div class="flex items-center">
                <span class="w-16 text-sm">消极:</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                  <div 
                    class="bg-red-500 h-2 rounded-full" 
                    :style="{ width: (singleResult!.probabilities.negative * 100) + '%' }"
                  ></div>
                </div>
                <span class="text-sm">{{ (singleResult!.probabilities.negative * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量分析结果 -->
        <div v-if="analysisResult.type === 'batch'" class="space-y-6">
          <!-- 统计信息 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">总数</div>
              <div class="stat-value text-lg">{{ batchResult!.statistics.total_count }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">积极</div>
              <div class="stat-value text-lg text-green-600">{{ batchResult!.statistics.positive_count }}</div>
              <div class="stat-desc">{{ (batchResult!.statistics.positive_ratio * 100).toFixed(1) }}%</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">消极</div>
              <div class="stat-value text-lg text-red-600">{{ batchResult!.statistics.negative_count }}</div>
              <div class="stat-desc">{{ (batchResult!.statistics.negative_ratio * 100).toFixed(1) }}%</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">中性</div>
              <div class="stat-value text-lg text-gray-600">{{ batchResult!.statistics.neutral_count }}</div>
              <div class="stat-desc">{{ (batchResult!.statistics.neutral_ratio * 100).toFixed(1) }}%</div>
            </div>
          </div>

          <!-- 预览结果 -->
          <div>
            <h3 class="font-medium text-gray-700 mb-4">分析预览</h3>
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>评论内容</th>
                    <th>情感倾向</th>
                    <th>置信度</th>
                    <th>关键词</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in batchResult!.preview_results" :key="result.row_index">
                    <td>{{ result.row_index + 1 }}</td>
                    <td class="max-w-xs truncate">{{ result.comment_text }}</td>
                    <td>
                      <span class="badge" :class="getSentimentBadgeColor(getSentimentValue(result))">
                        {{ getSentimentText(getSentimentValue(result)) }}
                      </span>
                    </td>
                    <td>{{ (result.confidence * 100).toFixed(1) }}%</td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="keyword in result.keywords.slice(0, 3)"
                          :key="keyword"
                          class="badge badge-outline badge-xs"
                        >
                          {{ keyword }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认删除</h3>
        <p class="py-4">您确定要删除这条分析记录吗？此操作不可撤销。</p>
        <div class="modal-action">
          <button @click="showDeleteModal = false" class="btn">取消</button>
          <button @click="deleteRecord" class="btn btn-error" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading loading-spinner loading-sm"></span>
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { singleAnalyze, batchAnalyze, deleteRecord as deleteRecordApi } from '@/api/index'
import type { SingleAnalyzeResponse, BatchAnalyzeResponse } from '@/types/apis/PagesAPI_T'

// 响应式数据
const activeTab = ref<'text' | 'file'>('text')
const textInput = ref('')
const selectedFile = ref<File | null>(null)
const commentColumn = ref('')
const isAnalyzing = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const fileInput = ref<HTMLInputElement>()

// 分析结果
const analysisResult = ref<{
  type: 'single' | 'batch'
  data: SingleAnalyzeResponse['data'] | BatchAnalyzeResponse['data']
  id: number
} | null>(null)

// 计算属性：区分单条和批量分析数据，避免模板类型冲突
const singleResult = computed(() => analysisResult.value?.type === 'single' ? analysisResult.value.data as SingleAnalyzeResponse['data'] : null)
const batchResult = computed(() => analysisResult.value?.type === 'batch' ? analysisResult.value.data as BatchAnalyzeResponse['data'] : null)

// 文件选择处理
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      ElMessage.error('请选择CSV格式的文件')
      return
    }
    selectedFile.value = file
  }
}

// 文字分析
const analyzeText = async () => {
  if (!textInput.value.trim()) {
    ElMessage.warning('请输入要分析的文字内容')
    return
  }

  isAnalyzing.value = true
  try {
    const response = await singleAnalyze({ comment_text: textInput.value.trim() })
    if (response.code === 200) {
      analysisResult.value = {
        type: 'single',
        data: response.data,
        id: response.data.id
      }
      ElMessage.success('分析完成')
    } else {
      ElMessage.error(response.msg || '分析失败')
    }
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('分析失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 文件分析
const analyzeFile = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要分析的CSV文件')
    return
  }

  isAnalyzing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (commentColumn.value.trim()) {
      formData.append('comment_column', commentColumn.value.trim())
    }

    const response = await batchAnalyze(formData)
    if (response.code === 200) {
      analysisResult.value = {
        type: 'batch',
        data: response.data,
        id: response.data.id
      }
      ElMessage.success('分析完成')
    } else {
      ElMessage.error(response.msg || '分析失败')
    }
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('分析失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 删除记录
const deleteRecord = async () => {
  if (!analysisResult.value) return

  isDeleting.value = true
  try {
    const response = await deleteRecordApi({ record_id: analysisResult.value.id })
    if (response.code === 200) {
      ElMessage.success('删除成功')
      analysisResult.value = null
      showDeleteModal.value = false
      // 重置表单
      textInput.value = ''
      selectedFile.value = null
      commentColumn.value = ''
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

// 工具函数
const getSentimentText = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '积极'
    case 'negative': return '消极'
    case 'neutral': return '中性'
    default: return sentiment
  }
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'text-green-600'
    case 'negative': return 'text-red-600'
    case 'neutral': return 'text-gray-600'
    default: return 'text-gray-600'
  }
}

const getSentimentBadgeColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'badge-success'
    case 'negative': return 'badge-error'
    case 'neutral': return 'badge-neutral'
    default: return 'badge-neutral'
  }
}

// 获取情感字段值的统一函数，处理API字段名不一致的问题
const getSentimentValue = (data: any) => {
  // API设计不一致导致的字段名差异：
  // - 单条分析响应(/sentiment/analyze/single/)：使用 hzsystem_sentiment
  // - 批量分析响应(/sentiment/analyze/batch/)：使用 hzsystem_sentiment  
  // - 历史记录响应(/sentiment/history/)：使用 sentiment
  // - 分析详情响应(/sentiment/detail/)：使用 sentiment
  return data.hzsystem_sentiment || data.sentiment
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.modal-open {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
