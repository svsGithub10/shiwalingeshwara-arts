package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;

@Entity
@Table(name="order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private String workType;

    private Long materialId;

    private String topLayer;

    private String dxfFile;

    private double itemPrice;

    public OrderItem(){}

    public Long getId(){ return id; }
    public Long getOrderId(){ return orderId; }
    public String getWorkType(){ return workType; }
    public Long getMaterialId(){ return materialId; }
    public String getTopLayer(){ return topLayer; }
    public String getDxfFile(){ return dxfFile; }
    public double getItemPrice(){ return itemPrice; }

    public void setId(Long id){ this.id=id; }
    public void setOrderId(Long orderId){ this.orderId=orderId; }
    public void setWorkType(String workType){ this.workType=workType; }
    public void setMaterialId(Long materialId){ this.materialId=materialId; }
    public void setTopLayer(String topLayer){ this.topLayer=topLayer; }
    public void setDxfFile(String dxfFile){ this.dxfFile=dxfFile; }
    public void setItemPrice(double itemPrice){ this.itemPrice=itemPrice; }
}