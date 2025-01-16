const fs = require('fs').promises;
const path = require('path');
const Docker = require('dockerode');
const docker = new Docker();
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

// Function to execute code using Docker
const executeCode = async (code, language) => {
    if (!languageConfig[language]) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const { image, extension, command } = languageConfig[language];
    const tempFilePath = path.join(__dirname, 'temp', `temp_code.${extension}`);

    try {
        // Ensure the directory exists and write the code to the temporary file
        await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
        await fs.writeFile(tempFilePath, code);

        const container = await docker.createContainer({
            Image: image,
            Tty: false,
            Cmd: command,
            HostConfig: {
                Binds: [`${path.dirname(tempFilePath)}:/code`],
            },
        });

        console.log(`Starting Docker container for ${language}...`);

        await container.start();
        await container.wait();
        const logs = await container.logs({
            stdout: true,
            stderr: true,
        });

        await container.remove();
        await fs.unlink(tempFilePath);

        const output = logs.toString("utf-8").trim();
        
        return { output };
    } catch (error) {
        console.error("Error executing code:", error);
        await fs.unlink(tempFilePath).catch(() => null);
        throw new Error("Code execution failed");
    }
};

module.exports = { executeCode };
