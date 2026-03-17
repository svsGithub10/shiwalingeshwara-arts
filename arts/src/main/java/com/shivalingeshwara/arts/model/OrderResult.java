package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="order_results")
public class OrderResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderItemId;

    private String imagePath;

    private LocalDateTime uploadedAt;

    public OrderResult(){}

    public Long getId(){ return id; }
    public Long getOrderItemId(){ return orderItemId; }
    public String getImagePath(){ return imagePath; }
    public LocalDateTime getUploadedAt(){ return uploadedAt; }

    public void setId(Long id){ this.id=id; }
    public void setOrderItemId(Long orderItemId){ this.orderItemId=orderItemId; }
    public void setImagePath(String imagePath){ this.imagePath=imagePath; }
    public void setUploadedAt(LocalDateTime uploadedAt){ this.uploadedAt=uploadedAt; }
}