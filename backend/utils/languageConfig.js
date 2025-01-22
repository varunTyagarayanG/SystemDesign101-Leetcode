const languageConfig = {
    python: {
        image: "python:3.9-slim",
        extension: "py",
        command: ["python", "/code/temp_code.py"],
    },
    javascript: {
        image: "node:16",
        extension: "js",
        command: ["node", "/code/temp_code.js"],
    },
    java: {
        image: "openjdk:17-slim",
        extension: "java",
        command: ["bash", "-c", "javac /code/temp_code.java && java -cp /code temp_code"],
    },
    c: {
        image: "gcc:latest",
        extension: "c",
        command: ["bash", "-c", "gcc /code/temp_code.c -o /code/temp_code && /code/temp_code"],
    },
    cpp: {
        image: "gcc:latest",
        extension: "cpp",
        command: ["bash", "-c", "g++ /code/temp_code.cpp -o /code/temp_code && /code/temp_code"],
    },
};

module.exports = { languageConfig };