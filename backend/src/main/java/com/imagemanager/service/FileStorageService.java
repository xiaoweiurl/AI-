package com.imagemanager.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * 文件存储服务接口
 */
public interface FileStorageService {
    
    /**
     * 上传文件
     */
    String uploadFile(MultipartFile file, String path);
    
    /**
     * 上传文件（字节数组）
     */
    String uploadFile(byte[] data, String fileName, String contentType);
    
    /**
     * 获取文件访问URL
     */
    String getFileUrl(String fileKey);
    
    /**
     * 生成预签名URL
     */
    String generatePresignedUrl(String fileKey, int expireSeconds);
    
    /**
     * 删除文件
     */
    boolean deleteFile(String fileKey);
    
    /**
     * 获取存储key
     */
    String getStorageKey(String fileKey);
    
    /**
     * 获取文件输入流
     */
    InputStream getFileInputStream(String fileKey) throws Exception;
    
    /**
     * 检查文件是否存在
     */
    boolean fileExists(String fileKey);
}
