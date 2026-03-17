package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByParentId(Long parentId);
    List<Material> findByParentIdIsNull();

}