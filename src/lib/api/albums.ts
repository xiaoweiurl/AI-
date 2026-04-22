/**
 * 相册 API 服务
 * 
 * 相册相关的接口调用
 */

import { get, post, put, del } from './client';
import type { ApiResponse, Album } from './types';

/**
 * 获取所有相册
 */
export async function getAlbums(): Promise<Album[]> {
  const response = await get<ApiResponse<Album[]>>('/albums');
  return response.data;
}

/**
 * 获取相册树（层级结构）
 */
export async function getAlbumTree(userId?: string): Promise<Album[]> {
  const params = userId ? `?userId=${userId}` : '';
  const response = await get<ApiResponse<Album[]>>(`/albums/tree${params}`);
  return response.data;
}

/**
 * 获取相册详情
 */
export async function getAlbumById(id: string): Promise<Album> {
  const response = await get<ApiResponse<Album>>(`/albums/${id}`);
  return response.data;
}

/**
 * 获取子相册
 */
export async function getChildAlbums(parentId: string): Promise<Album[]> {
  const response = await get<ApiResponse<Album[]>>(`/albums/${parentId}/children`);
  return response.data;
}

/**
 * 创建相册
 */
export async function createAlbum(data: { name: string; description?: string; parentId?: string }): Promise<Album> {
  const response = await post<ApiResponse<Album>>('/albums', data);
  return response.data;
}

/**
 * 创建层级相册
 */
export async function createAlbumWithParent(data: { name: string; parentId?: string; description?: string }): Promise<Album> {
  const response = await post<ApiResponse<Album>>('/albums/tree', data);
  return response.data;
}

/**
 * 根据路径获取或创建相册
 * @param path 完整路径，如 "松野湃/速干T恤"
 */
export async function getOrCreateAlbumByPath(path: string): Promise<Album> {
  const response = await post<ApiResponse<Album>>('/albums/by-path', { path });
  return response.data;
}

/**
 * 更新相册
 */
export async function updateAlbum(
  id: string,
  data: { name?: string; description?: string }
): Promise<Album> {
  const response = await put<ApiResponse<Album>>(`/albums/${id}`, data);
  return response.data;
}

/**
 * 删除相册
 */
export async function deleteAlbum(id: string): Promise<void> {
  await del<ApiResponse<void>>(`/albums/${id}`);
}
