package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.User;
import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.repository.PaymentRepository;
import com.shivalingeshwara.arts.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private UserRepository userRepository;


    // GET ALL CLIENTS
    @GetMapping
    public List<User> getClients(){

        return userRepository.findByRole("CLIENT");

    }


    // SEARCH CLIENTS
    @GetMapping("/search")
    public List<User> searchClients(@RequestParam String q){

        return userRepository
                .findByNameContainingIgnoreCaseAndRole(q,"CLIENT");

    }


    // GET CLIENT BY PHONE
    @GetMapping("/phone/{phone}")
    public User getClientByPhone(@PathVariable String phone){

        return userRepository
                .findByPhone(phone)
                .orElse(null);

    }


    // CREATE CLIENT
    @PostMapping
    public User createClient(@RequestBody Map<String,String> req){

        User u = new User();

        u.setName(req.get("name"));
        u.setPhone(req.get("phone"));
        u.setCity(req.get("city"));

        u.setRole("CLIENT");
        u.setSystemUser(false);

        return userRepository.save(u);

    }


    // UPDATE CLIENT
    @PutMapping("/{id}")
    public User updateClient(@PathVariable Long id,
                             @RequestBody Map<String,String> req){

        User u = userRepository.findById(id).orElseThrow();

        if(req.get("name") != null)
            u.setName(req.get("name"));

        if(req.get("phone") != null)
            u.setPhone(req.get("phone"));

        if(req.get("city") != null)
            u.setCity(req.get("city"));

        if(req.get("address") != null)
            u.setAddress(req.get("address"));

        if(req.get("email") != null)
            u.setEmail(req.get("email"));

        return userRepository.save(u);

    }


    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;
  



@DeleteMapping("/{id}")
public Map<String,String> deleteClient(@PathVariable Long id){

    Map<String,String> res = new HashMap<>();

    User u = userRepository.findById(id).orElse(null);

    if(u == null){
        res.put("status","error");
        res.put("message","Client not found");
        return res;
    }

    if(u.isSystemUser()){
        res.put("status","error");
        res.put("message","Cannot delete system user");
        return res;
    }

    // ✅ 1. GET ALL ORDERS OF CLIENT
    List<Order> orders = orderRepository.findByClientId(id);

    for(Order o : orders){

        // ✅ 2. DELETE PAYMENTS OF EACH ORDER
        paymentRepository.deleteByOrderId(o.getId());

    }

    // ✅ 3. DELETE ORDERS
    orderRepository.deleteAll(orders);

    // ✅ 4. DELETE USER
    userRepository.deleteById(id);

    res.put("status","success");

    return res;
}

}