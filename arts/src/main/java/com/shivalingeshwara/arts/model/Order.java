package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;

@Entity
@Table(name="orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="client_id")
    private Long clientId;

    @Column(name="work_type")
    private String workType;

    private String materials;

    @Column(name="top_layer")
    private String topLayer;

    @Column(name="bg_color")
    private String bgColor;

    @Column(name="height")
    private Double height;

    @Column(name="remark")
    private String remark;

    private Double price;

    @Column(name="display_price")
    private Double displayPrice;

    @Column(name="advance_paid")
    private Double advancePaid;

    private String status;

    @Column(name="dxf_file")
    private String dxfFile;

    @Column(name="result_image")
    private String resultImage;

@Column(name="created_at")
private java.time.LocalDateTime createdAt;

@Column(name="delivered_at")
private java.time.LocalDateTime deliveredAt;

public java.time.LocalDateTime getDeliveredAt() {
    return deliveredAt;
}

public void setDeliveredAt(java.time.LocalDateTime deliveredAt) {
    this.deliveredAt = deliveredAt;
}

    public Order(){}

    public Long getId(){ return id; }

    public Long getClientId(){ return clientId; }

    public String getWorkType(){ return workType; }

    public String getMaterials(){ return materials; }

    public String getTopLayer(){ return topLayer; }

    public String getBgColor(){ return bgColor; }

    public Double getHeight(){ return height; }
    
    public String getRemark(){ return remark; }

    public Double getPrice(){ return price; }

    public Double getDisplayPrice(){ return displayPrice; }

    public Double getAdvancePaid(){ return advancePaid; }

    public String getStatus(){ return status; }

    public String getDxfFile(){ return dxfFile; }

    public String getResultImage(){ return resultImage; }

    public void setId(Long id){ this.id=id; }

    public void setClientId(Long clientId){ this.clientId=clientId; }

    public void setWorkType(String workType){ this.workType=workType; }

    public void setMaterials(String materials){ this.materials=materials; }

    public void setTopLayer(String topLayer){ this.topLayer=topLayer; }
    
    public void setBgColor(String bgColor){ this.bgColor=bgColor; }

    public void setHeight(Double height){ this.height=height; }

    public void setRemark(String remark){ this.remark=remark; }

    public void setPrice(Double price){ this.price=price; }

    public void setDisplayPrice(Double displayPrice){ this.displayPrice=displayPrice; }

    public void setAdvancePaid(Double advancePaid){ this.advancePaid=advancePaid; }

    public void setStatus(String status){ this.status=status; }

    public void setDxfFile(String dxfFile){ this.dxfFile=dxfFile; }

    public void setResultImage(String resultImage){ this.resultImage=resultImage; }
public java.time.LocalDateTime getCreatedAt() {
    return createdAt;
}

public void setCreatedAt(java.time.LocalDateTime createdAt) {
    this.createdAt = createdAt;
}
}