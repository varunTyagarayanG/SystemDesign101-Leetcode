const fs = require('fs').promises;
const path = require('path'); 
const Docker = require('dockerode');
const docker = new Docker();

const executeCode = async (code) => {
    try {
        const image = "python:3.9-slim"; 
        const tempFilePath = path.join(__dirname, 'temp', `temp_code.py`);

        // Ensure the temp directory exists
        await fs.mkdir(path.dirname(tempFilePath), { recursive: true });

        // Write the code to a temporary file
        await fs.writeFile(tempFilePath, code);

        // Create a Docker container to execute the code
        const container = await docker.createContainer({
            Image: image,
            Tty: false,
            Cmd: ["python", "/code/temp_code.py"], // Command to execute the Python file
            HostConfig: {
                Binds: [`${path.dirname(tempFilePath)}:/code`], // Mount the temp directory
            },
        });

        console.log(`Starting Docker container for ${image}...`);

        // Start the container
        await container.start();

        // Wait for the container to finish execution
        await container.wait();

        // Collect the logs from the container
        const logs = await container.logs({
            stdout: true,
            stderr: true,
        });

        // Convert logs from Buffer to string
        const output = logs.toString("utf-8").trim();

        // Remove the container
        await container.remove();

        // Clean up the temp file
        await fs.unlink(tempFilePath);

        return { output };
    } catch (error) {
        console.error("Error executing code:", error);
        throw new Error("Code execution failed");
    }
};

module.exports = { executeCode };
