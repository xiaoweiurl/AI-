package com.imagemanager.repository;

import com.imagemanager.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 商品数据访问接口
 *
 * @author Image Manager Team
 * @version 1.0.0
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    /**
     * 根据用户ID查询商品列表
     */
    List<Product> findByUserId(String userId);

    /**
     * 根据相册ID查询商品列表
     */
    List<Product> findByAlbumId(String albumId);

    /**
     * 根据相册ID和用户ID查询商品列表
     */
    List<Product> findByAlbumIdAndUserId(String albumId, String userId);

    /**
     * 根据名称和用户ID查询商品
     */
    Optional<Product> findByNameAndUserId(String name, String userId);

}
