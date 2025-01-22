const fs = require('fs').promises;
const path = require('path');
const Docker = require('dockerode');
const docker = new Docker();
const Problem = require('../models/Problem'); 
const { languageConfig } = require('../utils/languageConfig');

const executeCode = async (code, language, problemId) => {
    if (!languageConfig[language]) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const { image, extension, command } = languageConfig[language];

    // Temporary file paths
    const tempCodeFilePath = path.join(__dirname, 'temp', `temp_code.${extension}`);

    try {
        // Fetch the problem's main code from the database
        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new Error(`Problem with ID ${problemId} not found`);
        }

        const mainCode = problem.mainCode; 
        if (!mainCode) {
            throw new Error(`Main code is missing for problem ID ${problemId}`);
        }

        // Combine user's code with the problem's main code
        const fullCode = `${code}\n\n${mainCode}`;
        // Ensure temp directory exists
        await fs.mkdir(path.dirname(tempCodeFilePath), { recursive: true });

        // Write combined code to a temp file
        await fs.writeFile(tempCodeFilePath, fullCode);

        // Create a Docker container to execute the code
        const container = await docker.createContainer({
            Image: image,
            Tty: false,
            Cmd: command,
            HostConfig: {
                Binds: [`${path.dirname(tempCodeFilePath)}:/code`],
            },
        });

        console.log(`Starting Docker container for ${language}...`);
        await container.start();

        // Wait for the container to complete execution
        const containerResult = await container.wait();

        // Fetch logs from the container
        const logs = await container.logs({
            stdout: true,
            stderr: true,
        });

        // Remove the container and clean up temp files
        await container.remove();
        await fs.unlink(tempCodeFilePath);

        // Parse and return output
        const output = logs.toString('utf-8').trim();
        if (containerResult.StatusCode === 0) {
            return { success: true, output ,fullCode};
        } else {
            return { success: false, output ,fullCode}; ;
        }
    } catch (error) {
        console.error("Error executing code:", error.message || error);
        await fs.unlink(tempCodeFilePath).catch(() => null); // Clean up
        throw new Error("Code execution failed");
    }
};

module.exports = { executeCode };
