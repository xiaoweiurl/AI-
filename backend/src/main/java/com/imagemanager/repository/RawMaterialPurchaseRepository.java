package com.imagemanager.repository;

import com.imagemanager.entity.RawMaterialPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RawMaterialPurchaseRepository extends JpaRepository<RawMaterialPurchase, Integer>, JpaSpecificationExecutor<RawMaterialPurchase> {
    List<RawMaterialPurchase> findByMaterialCode(String materialCode);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT p.supplier) FROM RawMaterialPurchase p")
    long countDistinctSupplier();

    @org.springframework.data.jpa.repository.Query("SELECT MIN(p.unitPrice) FROM RawMaterialPurchase p WHERE p.materialCode = :materialCode")
    java.math.BigDecimal findMinPriceByMaterialCode(@org.springframework.data.repository.query.Param("materialCode") String materialCode);

    @org.springframework.data.jpa.repository.Query("SELECT p.supplier FROM RawMaterialPurchase p WHERE p.materialCode = :materialCode AND p.unitPrice = (SELECT MIN(p2.unitPrice) FROM RawMaterialPurchase p2 WHERE p2.materialCode = :materialCode)")
    java.util.List<String> findCheapestSupplierByMaterialCode(@org.springframework.data.repository.query.Param("materialCode") String materialCode);

    @org.springframework.data.jpa.repository.Query("SELECT p.unit FROM RawMaterialPurchase p WHERE p.materialCode = :materialCode AND p.unitPrice = (SELECT MIN(p2.unitPrice) FROM RawMaterialPurchase p2 WHERE p2.materialCode = :materialCode)")
    java.util.List<String> findCheapestUnitByMaterialCode(@org.springframework.data.repository.query.Param("materialCode") String materialCode);
}
