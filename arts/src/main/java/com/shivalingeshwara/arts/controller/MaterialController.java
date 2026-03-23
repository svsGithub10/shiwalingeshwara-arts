package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Material;
import com.shivalingeshwara.arts.repository.MaterialRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    @Autowired
    private MaterialRepository materialRepository;


    // ===============================
    // GET ALL MATERIALS
    // ===============================
    @GetMapping
    public List<Material> getMaterials(){
        return materialRepository.findAll();
    }


    // ===============================
    // ADD MATERIAL
    // ===============================
    @PostMapping
    public Material addMaterial(@RequestBody Map<String,Object> req){

        Material m = new Material();

        m.setName((String) req.get("name"));

        if(req.get("parentId") != null && !req.get("parentId").toString().isEmpty()){
            m.setParentId(Long.valueOf(req.get("parentId").toString()));
        }

        // ✅ STOCK STATUS ONLY
        if(req.get("stockStatus") != null){
            m.setStockStatus(req.get("stockStatus").toString());
        } else {
            m.setStockStatus("IN_STOCK"); // default
        }

        return materialRepository.save(m);
    }


    // ===============================
    // UPDATE STOCK STATUS
    // ===============================
    @PutMapping("/stock")
    public Material updateStock(@RequestBody Map<String,Object> req){

        Long id = Long.valueOf(req.get("id").toString());

        Material m = materialRepository.findById(id).orElseThrow();

        // ✅ DIRECT STATUS UPDATE
        if(req.get("stockStatus") != null){
            m.setStockStatus(req.get("stockStatus").toString());
        }

        return materialRepository.save(m);
    }


    // ===============================
    // EDIT MATERIAL
    // ===============================
    @PutMapping("/{id}")
    public Material updateMaterial(@PathVariable Long id,
                                   @RequestBody Map<String,Object> req){

        Material m = materialRepository.findById(id).orElseThrow();

        if(req.get("name") != null){
            m.setName(req.get("name").toString());
        }

        if(req.get("parentId") != null && !req.get("parentId").toString().isEmpty()){
            m.setParentId(Long.valueOf(req.get("parentId").toString()));
        }

        // ✅ UPDATE STATUS
        if(req.get("stockStatus") != null){
            m.setStockStatus(req.get("stockStatus").toString());
        }

        return materialRepository.save(m);
    }


    // ===============================
    // DELETE MATERIAL
    // ===============================
    @DeleteMapping("/{id}")
    public Map<String,String> deleteMaterial(@PathVariable Long id){

        Map<String,String> res = new HashMap<>();

        Material m = materialRepository.findById(id).orElse(null);

        if(m == null){
            res.put("status","error");
            res.put("message","Material not found");
            return res;
        }

        // check children
        List<Material> children = materialRepository.findByParentId(id);

        if(children.size() > 0){
            res.put("status","error");
            res.put("message","Cannot delete material with children");
            return res;
        }

        materialRepository.deleteById(id);

        res.put("status","success");
        res.put("message","Material deleted");

        return res;
    }

}