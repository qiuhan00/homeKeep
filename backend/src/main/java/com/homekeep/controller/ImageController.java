package com.homekeep.controller;

import com.homekeep.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@Slf4j
public class ImageController {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    /**
     * 上传图片
     * @param file 上传的图片文件，支持 PNG、JPG、GIF 等格式
     * @return 上传成功后的图片访问路径
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("文件不能为空"));
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("只能上传图片文件"));
        }

        try {
            // Create upload directory if not exists
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return URL
            String imageUrl = "/api/images/" + filename;
            log.info("Image uploaded successfully: {}", imageUrl);

            return ResponseEntity.ok(ApiResponse.success("图片上传成功", imageUrl));
        } catch (IOException e) {
            log.error("Failed to upload image", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("图片上传失败"));
        }
    }

    /**
     * 获取图片
     * @param filename 图片文件名（UUID + 扩展名）
     * @return 图片二进制数据
     */
    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath).resolve(filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(imageBytes);
        } catch (IOException e) {
            log.error("Failed to read image: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}