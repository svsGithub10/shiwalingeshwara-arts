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

    private Double price;

    @Column(name="advance_paid")
    private Double advancePaid;

    private String status;

    @Column(name="dxf_file")
    private String dxfFile;

    @Column(name="result_image")
    private String resultImage;

@Column(name="created_at")
private java.time.LocalDateTime createdAt;

    public Order(){}

    public Long getId(){ return id; }

    public Long getClientId(){ return clientId; }

    public String getWorkType(){ return workType; }

    public String getMaterials(){ return materials; }

    public String getTopLayer(){ return topLayer; }

    public Double getPrice(){ return price; }

    public Double getAdvancePaid(){ return advancePaid; }

    public String getStatus(){ return status; }

    public String getDxfFile(){ return dxfFile; }

    public String getResultImage(){ return resultImage; }

    public void setId(Long id){ this.id=id; }

    public void setClientId(Long clientId){ this.clientId=clientId; }

    public void setWorkType(String workType){ this.workType=workType; }

    public void setMaterials(String materials){ this.materials=materials; }

    public void setTopLayer(String topLayer){ this.topLayer=topLayer; }

    public void setPrice(Double price){ this.price=price; }

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