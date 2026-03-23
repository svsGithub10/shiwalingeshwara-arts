package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.*;
import com.shivalingeshwara.arts.repository.ExpenseRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin
public class ExpenseController {

    @Autowired
    private ExpenseRepository repo;

    // ✅ GET ALL / FILTER
    @GetMapping
    public List<Expense> getAll(@RequestParam(required = false) ExpenseType type) {
        if (type != null) {
            return repo.findByType(type);
        }
        return repo.findAll();
    }

    // ✅ ADD
    @PostMapping
    public Expense add(@RequestBody Expense e) {

        
        return repo.save(e);
    }

    // ✅ UPDATE
@PutMapping("/{id}")
public Expense update(@PathVariable Long id, @RequestBody Expense e) {

    Expense existing = repo.findById(id).orElseThrow();

    existing.setTitle(e.getTitle());
    existing.setType(e.getType());
    existing.setCategory(e.getCategory());
    existing.setAmount(e.getAmount());
    existing.setDate(e.getDate());
    existing.setNote(e.getNote());

    // ✅ IMPORTANT FIX
    if(e.getFileUrl() != null){
        existing.setFileUrl(e.getFileUrl());
    }

    return repo.save(existing);
}

    // ✅ DELETE
@DeleteMapping("/{id}")
public void delete(@PathVariable Long id) {

    Expense e = repo.findById(id).orElseThrow();

    // ✅ delete file if exists
    if(e.getFileUrl() != null && !e.getFileUrl().isEmpty()){

        try {
            String basePath = "C:/shivalingeshwara-arts/";

            // remove "/uploads/" from URL
            String relativePath = e.getFileUrl().replace("/uploads/", "");

            Path filePath = Paths.get(basePath + relativePath);

            Files.deleteIfExists(filePath);

        } catch (Exception ex){
            System.out.println("File delete failed: " + ex.getMessage());
        }
    }

    // ✅ delete DB record
    repo.deleteById(id);
}

    // ✅ PIGMY SUMMARY
    @GetMapping("/pigmy-summary")
    public Map<String, Object> pigmySummary() {

        List<Expense> list = repo.findByType(ExpenseType.PIGMY);

        Map<String, Double> map = new HashMap<>();
        double total = 0;

        for (Expense e : list) {
            map.put(e.getCategory(),
                map.getOrDefault(e.getCategory(), 0.0) + e.getAmount());
            total += e.getAmount();
        }

        Map<String, Object> res = new HashMap<>();
        res.put("byAccount", map);
        res.put("total", total);

        return res;
    }
}