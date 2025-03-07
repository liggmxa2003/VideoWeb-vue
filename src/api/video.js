import request from "@/utils/request"

//获取视频列表接口
export const getVideoListService = () => {
    return request.get('/video')
}
//获取视频详情接口
export const getVideoDetailService = (videoId) => {
    return request.get('/video/videoInfo?id='+videoId)
}
