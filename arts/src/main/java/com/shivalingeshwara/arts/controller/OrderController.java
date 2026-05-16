package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.User;
import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.repository.PaymentRepository;
import com.shivalingeshwara.arts.repository.UserRepository;
import com.shivalingeshwara.arts.utils.FileStorageUtil;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;


@PostMapping
public Order createOrder(
        @RequestParam String name,
        @RequestParam String phone,
        @RequestParam String city,
        @RequestParam String workType,
        @RequestParam(required=false) String materials,
        @RequestParam(required=false) String topLayer,
        @RequestParam(required=false) String bgColor,
        @RequestParam(required=false) Double height,   
        @RequestParam(required=false) String remark,
        @RequestParam Double price,
        @RequestParam Double advance,
        @RequestParam(required=false) MultipartFile file
) throws Exception {

    User client = userRepository.findByPhone(phone).orElse(null);

    if(client == null){
        client = new User();
        client.setName(name);
        client.setPhone(phone);
        client.setCity(city);
        client.setRole("CLIENT");
        userRepository.save(client);
    }

    Order o = new Order();

    o.setClientId(client.getId());
    o.setWorkType(workType);
    o.setMaterials(materials);
    o.setTopLayer(topLayer);
    o.setBgColor(bgColor);
    o.setHeight(height);
    o.setRemark(remark);
    o.setPrice(price);
    o.setAdvancePaid(advance);
    o.setCreatedAt(java.time.LocalDateTime.now());
    o.setStatus("CREATED");

    // ✅ DXF upload
    if(file != null && !file.isEmpty()){

        String folder = FileStorageUtil.createFolder("C:/shivalingeshwara-arts/dxf");

        // 🔥 prevent duplicate names
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

        String path = folder + "/" + fileName;

        file.transferTo(new java.io.File(path));

        o.setDxfFile(path);
    }

    return orderRepository.save(o);
}


    // GET ORDERS BY CLIENT
    @GetMapping("/client/{clientId}")
    public List<Order> getOrders(@PathVariable Long clientId){

        return orderRepository.findByClientId(clientId);

    }

@PutMapping("/{id}")
public Order updateOrder(
        @PathVariable Long id,
        @RequestParam String workType,
        @RequestParam String materials,
        @RequestParam(required=false) String topLayer,
        @RequestParam(required=false) String bgColor,
        @RequestParam(required=false) Double height,
        @RequestParam(required=false) String remark,
        @RequestParam Double price,
        @RequestParam Double advance,
        @RequestParam(required = false) String createdAt,
        @RequestParam(required=false) MultipartFile file
) throws Exception {

    Order o = orderRepository.findById(id).orElseThrow();

    o.setWorkType(workType);
    o.setMaterials(materials);
    o.setTopLayer(topLayer);
    o.setBgColor(bgColor);
    o.setHeight(height);
    o.setPrice(price);
    o.setRemark(remark);
    o.setAdvancePaid(advance);
if(createdAt != null && !createdAt.isBlank()){
    o.setCreatedAt(
        java.time.LocalDate.parse(createdAt)
            .atTime(12, 0) // ✅ set mid-day instead of midnight
    );
}



    // ✅ ONLY replace if new file uploaded
    if(file != null && !file.isEmpty()){

            // delete old file
    if(o.getDxfFile() != null){

        java.io.File oldFile = new java.io.File(o.getDxfFile());

        if(oldFile.exists()){
            boolean deleted = oldFile.delete();
System.out.println("Old file deleted: " + deleted);
        }
    }

        String folder = FileStorageUtil.createFolder("C:/shivalingeshwara-arts/dxf");

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

        String path = folder + "/" + fileName;

        file.transferTo(new java.io.File(path));

        o.setDxfFile(path);
    }

    return orderRepository.save(o);
}

@PutMapping("/{id}/deliver")
public Order markDelivered(@PathVariable Long id){

    Order o = orderRepository.findById(id).orElseThrow();

    o.setStatus("DELIVERED");
    o.setDeliveredAt(java.time.LocalDateTime.now());

    return orderRepository.save(o);
}

@PutMapping("/{id}/inProgress")
public Order markInProgress(@PathVariable Long id){

    Order o = orderRepository.findById(id).orElseThrow();

    o.setStatus("IN_PROGRESS");
    // o.setDeliveredAt(java.time.LocalDateTime.now());

    return orderRepository.save(o);
}

@PutMapping("/{id}/completed")
public Order markCompleted(@PathVariable Long id){

    Order o = orderRepository.findById(id).orElseThrow();

    o.setStatus("COMPLETED");

    return orderRepository.save(o);
}

@DeleteMapping("/{id}")
public Map<String,String> deleteOrder(@PathVariable Long id){

    Map<String,String> res = new HashMap<>();

    Order o = orderRepository.findById(id).orElse(null);

    if(o == null){
        res.put("status","error");
        res.put("message","Order not found");
        return res;
    }

    // ✅ DELETE FILES (DXF + RESULT)
    try{

        if(o.getDxfFile() != null){
            java.io.File f = new java.io.File(o.getDxfFile());
            if(f.exists()) f.delete();
        }

        if(o.getResultImage() != null){
            java.io.File f = new java.io.File(o.getResultImage());
            if(f.exists()) f.delete();
        }

    }catch(Exception e){
        e.printStackTrace();
    }

    // ✅ DELETE PAYMENTS (foreign key)
    paymentRepository.deleteAll(
            paymentRepository.findByOrderId(id)
    );

    // ✅ DELETE ORDER
    orderRepository.deleteById(id);

    res.put("status","success");
    return res;
}

@GetMapping("/download-dxf/{id}")
public ResponseEntity<Resource> downloadDxf(@PathVariable Long id) throws Exception {

    Order o = orderRepository.findById(id).orElseThrow();

    java.io.File file = new java.io.File(o.getDxfFile());

    if(!file.exists()){
        return ResponseEntity.notFound().build();
    }

    // ✅ UPDATE STATUS HERE
if("CREATED".equals(o.getStatus())){
    o.setStatus("IN_PROGRESS");
    orderRepository.save(o);
}

    org.springframework.core.io.Resource resource =
            new org.springframework.core.io.FileSystemResource(file);

    return ResponseEntity.ok()
            .header("Content-Disposition","attachment; filename=\"" + file.getName() + "\"")
            .body(resource);
}

@PostMapping("/upload-result/{id}")
public String uploadResult(@PathVariable Long id,
                           @RequestParam("file") MultipartFile file) throws Exception {

    Order o = orderRepository.findById(id).orElseThrow();

    if(file == null || file.isEmpty()){
        return "no file";
    }

    // ✅ delete old result image
    if(o.getResultImage() != null){

        java.io.File oldFile = new java.io.File(o.getResultImage());

        if(oldFile.exists()){
                        boolean deleted = oldFile.delete();
System.out.println("Old file deleted: " + deleted);
        }
    }

    String folder = FileStorageUtil.createFolder("C:/shivalingeshwara-arts/results");

    // 🔥 prevent duplicate names
    String fileName = System.currentTimeMillis() +".jpg";

    String filePath = folder + "/" + fileName;

    java.io.File outputFile = new java.io.File(filePath);

    // ✅ compress + resize image
    net.coobird.thumbnailator.Thumbnails
            .of(file.getInputStream())
            .size(1600, 1600) // resize large images
            .outputQuality(0.6) // compression quality
            .outputFormat("jpg")
            .toFile(outputFile);

    o.setResultImage(filePath);
    o.setStatus("COMPLETED");

    orderRepository.save(o);

    return "done";
}

@GetMapping("/production")
public List<Order> getProductionOrders(){

    return orderRepository.findAll()
            .stream()
            .filter(o -> {

                // 🔥 identify laser work
                boolean isLaser =
                        o.getWorkType() != null &&
                        o.getWorkType().startsWith("LASER");

                // ✅ LASER → must have DXF
                if(isLaser){
                    return o.getDxfFile() != null;
                }

                // ✅ NON-LASER → allow always
                return true;
            })
            .toList();
}

@GetMapping("/view-result")
public ResponseEntity<Resource> viewResult(@RequestParam String path) throws Exception {

    java.io.File file = new java.io.File(path);

    if(!file.exists()){
        return ResponseEntity.notFound().build();
    }

    Resource resource = new org.springframework.core.io.FileSystemResource(file);

    return ResponseEntity.ok().body(resource);
}

// 🔥 update 0.43 - GET ALL ORDERS
@GetMapping
public List<Order> getAllOrders(){
    return orderRepository.findAll();
}

@GetMapping("/{id}")
public Order getOrderById(@PathVariable Long id){

    return orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
}

@PutMapping("/{id}/display-price")
public Order updateDisplayPrice(
        @PathVariable Long id,
        @RequestBody Map<String, Double> body
){

    Order o = orderRepository.findById(id).orElseThrow();

    o.setDisplayPrice(body.get("displayPrice"));

    return orderRepository.save(o);
}

}