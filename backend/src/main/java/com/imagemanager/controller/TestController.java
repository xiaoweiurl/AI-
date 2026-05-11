package com.imagemanager.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from test controller!";
    }

    @PostMapping("/batch")
    public String batchTest() {
        return "Batch test controller works!";
    }
}
