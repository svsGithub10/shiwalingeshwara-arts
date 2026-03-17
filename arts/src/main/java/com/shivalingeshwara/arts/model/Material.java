package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;

@Entity
@Table(name="materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Long parentId;

    private Integer stock;

    private String stockStatus;

    public Material(){}

    public Long getId(){ return id; }
    public String getName(){ return name; }
    public Long getParentId(){ return parentId; }
    public String getStockStatus(){ return stockStatus; }
    public Integer getStock(){ return stock; }

    public void setId(Long id){ this.id=id; }
    public void setName(String name){ this.name=name; }
    public void setStock(Integer stock){ this.stock=stock; }
    public void setParentId(Long parentId){ this.parentId=parentId; }
    public void setStockStatus(String stockStatus){ this.stockStatus=stockStatus; }
}