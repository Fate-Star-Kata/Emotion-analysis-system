import serviceAxios from '@/http';
import type {
  SingleAnalyzeRequest,
  SingleAnalyzeResponse,
  BatchAnalyzeRequest,
  BatchAnalyzeResponse,
  GetHistoryRequest,
  GetHistoryResponse,
  GetDetailResponse,
  GetStatisticsResponse,
  DeleteRecordRequest,
  DeleteRecordResponse,
} from '@/types/apis/PagesAPI_T';

// 单条评论情感分析
export function singleAnalyze(data: SingleAnalyzeRequest): Promise<SingleAnalyzeResponse> {
  return serviceAxios({
    url: '/sentiment/analyze/single/',
    method: 'post',
    data,
  });
}

// 批量CSV文件情感分析
export function batchAnalyze(data: FormData): Promise<BatchAnalyzeResponse> {
  return serviceAxios({
    url: '/sentiment/analyze/batch/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 获取分析历史记录
export function getHistory(params?: GetHistoryRequest): Promise<GetHistoryResponse> {
  return serviceAxios({
    url: '/sentiment/history/',
    method: 'get',
    params,
  });
}

// 获取分析详情
export function getDetail(id: number): Promise<GetDetailResponse> {
  return serviceAxios({
    url: `/sentiment/detail/${id}/`,
    method: 'get',
  });
}

// 获取分析统计信息
export function getStatistics(): Promise<GetStatisticsResponse> {
  return serviceAxios({
    url: '/sentiment/statistics/',
    method: 'get',
  });
}

// 删除分析记录
export function deleteRecord(data: DeleteRecordRequest): Promise<DeleteRecordResponse> {
  return serviceAxios({
    url: '/sentiment/delete/',
    method: 'post',
    data,
  });
}