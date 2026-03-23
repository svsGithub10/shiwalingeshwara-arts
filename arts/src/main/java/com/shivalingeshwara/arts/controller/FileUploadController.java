package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.utils.FileStorageUtil;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.io.File;

@RestController
@CrossOrigin
public class FileUploadController {

    // ✅ Base directory (Windows path)
    private final String BASE_DIR = "C:/shivalingeshwara-arts/expenses";

    @PostMapping("/api/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws Exception {

        // ✅ Create month folder (mar-2026)
        String folderPath = FileStorageUtil.createFolder(BASE_DIR);

        // ✅ Unique file name
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

        // ✅ Full path
        Path path = Paths.get(folderPath + File.separator + fileName);

        // ✅ Save file
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        // ✅ Return URL (important for frontend access)
        String monthFolder = new File(folderPath).getName();

        return "/uploads/expenses/" + monthFolder + "/" + fileName;
    }
}