package com.imagemanager.repository;

import com.imagemanager.entity.RawMaterialPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RawMaterialPurchaseRepository extends JpaRepository<RawMaterialPurchase, Integer>, JpaSpecificationExecutor<RawMaterialPurchase> {
    List<RawMaterialPurchase> findByMaterialCode(String materialCode);
}
