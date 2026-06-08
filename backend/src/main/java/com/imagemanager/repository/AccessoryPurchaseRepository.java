package com.imagemanager.repository;

import com.imagemanager.entity.AccessoryPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessoryPurchaseRepository extends JpaRepository<AccessoryPurchase, Integer>, JpaSpecificationExecutor<AccessoryPurchase> {
    List<AccessoryPurchase> findByAccessoryName(String accessoryName);
}
