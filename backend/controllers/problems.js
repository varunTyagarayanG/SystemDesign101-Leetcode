const Problem = require('../models/Problem');

exports.getProblems = async (req, res) => {
    try {
        const problems = await Problem.find();
        res.status(200).json(problems);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching problems', error: err.message });
    }
};

exports.getProblem = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        res.status(200).json(problem);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching problem', error: err.message });
    }
};

exports.createProblem = async (req, res) => {
    try {
        const { title, description, codeStub, testCases, metadata } = req.body;

        const { difficulty, tags } = metadata || {};

        if (!title || !description || !codeStub || !testCases || !difficulty) {
            return res.status(400).json({
                message: 'Missing required fields: title, description, codeStub, testCases, and difficulty are required.',
            });
        }

        const mainCodeTemplates = {
            python: `
if __name__ == '__main__':
    import sys

    def run_test_cases():
        test_cases = ${JSON.stringify(testCases)}

        for case in test_cases:
            inputs = list(map(int, case['input'].split(',')))
            expected_output = case['output']
            try:
                result = sum_of_two_numbers(*inputs)
                if str(result) != expected_output:
                    print(f"Test failed for input: {case['input']}. Expected: {expected_output}, Got: {result}")
                    sys.exit(1)  # Exit with error code 1
            except Exception as e:
                print(f"Error while testing input {case['input']}: {str(e)}")
                sys.exit(1)  # Exit with error code 1

        print("All test cases passed successfully.")

    run_test_cases()
            `,
            java: `
public class Main {
    public static void main(String[] args) {
        String[][] testCases = ${JSON.stringify(
            testCases.map(tc => [tc.input, tc.output])
        )};
        for (String[] testCase : testCases) {
            String input = testCase[0];
            String expectedOutput = testCase[1];
            try {
                String[] parts = input.split(",");
                int a = Integer.parseInt(parts[0]);
                int b = Integer.parseInt(parts[1]);
                int result = sumOfTwoNumbers(a, b);
                if (!String.valueOf(result).equals(expectedOutput)) {
                    System.out.println("Test failed for input: " + input + ". Expected: " + expectedOutput + ", Got: " + result);
                    System.exit(1);
                }
            } catch (Exception e) {
                System.out.println("Error while testing input: " + input + ". " + e.getMessage());
                System.exit(1);
            }
        }
        System.out.println("All test cases passed successfully.");
    }
}
            `,
            node: `
const testCases = ${JSON.stringify(testCases)};

for (const { input, output } of testCases) {
    const inputs = input.split(",").map(Number);
    try {
        const result = sumOfTwoNumbers(...inputs);
        if (String(result) !== output) {
            console.error(\`Test failed for input: \${input}. Expected: \${output}, Got: \${result}\`);
            process.exit(1);
        }
    } catch (err) {
        console.error(\`Error while testing input \${input}: \${err.message}\`);
        process.exit(1);
    }
}
console.log("All test cases passed successfully.");
            `,
            cpp: `
#include <iostream>
#include <vector>
#include <sstream>
#include <string>
using namespace std;

int sum_of_two_numbers(int a, int b);

void run_test_cases() {
    vector<pair<string, string>> testCases = ${JSON.stringify(
        testCases.map(tc => [tc.input, tc.output])
    )};
    for (auto &testCase : testCases) {
        string input = testCase.first;
        string expectedOutput = testCase.second;
        stringstream ss(input);
        int a, b;
        char comma;
        ss >> a >> comma >> b;
        try {
            int result = sum_of_two_numbers(a, b);
            if (to_string(result) != expectedOutput) {
                cout << "Test failed for input: " << input << ". Expected: " << expectedOutput << ", Got: " << result << endl;
                exit(1);
            }
        } catch (exception &e) {
            cout << "Error while testing input: " << input << ". " << e.what() << endl;
            exit(1);
        }
    }
    cout << "All test cases passed successfully." << endl;
}

int main() {
    run_test_cases();
    return 0;
}
            `,
            c: `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int sum_of_two_numbers(int a, int b);

void run_test_cases() {
    struct TestCase {
        char input[20];
        char output[20];
    } testCases[] = ${JSON.stringify(
        testCases.map(tc => ({ input: tc.input, output: tc.output }))
    )};
    int n = sizeof(testCases) / sizeof(testCases[0]);

    for (int i = 0; i < n; i++) {
        struct TestCase testCase = testCases[i];
        int a, b;
        sscanf(testCase.input, "%d,%d", &a, &b);
        try {
            int result = sum_of_two_numbers(a, b);
            char resultStr[20];
            sprintf(resultStr, "%d", result);
            if (strcmp(resultStr, testCase.output) != 0) {
                printf("Test failed for input: %s. Expected: %s, Got: %s\\n", testCase.input, testCase.output, resultStr);
                exit(1);
            }
        } catch (...) {
            printf("Error while testing input: %s\\n", testCase.input);
            exit(1);
        }
    }
    printf("All test cases passed successfully.\\n");
}

int main() {
    run_test_cases();
    return 0;
}
            `
        };

        const mainCode = mainCodeTemplates.python;

        // Create the problem in the database
        const problem = await Problem.create({
            title,
            description,
            codeStub,
            testCases,
            metadata: {
                difficulty,
                tags: tags || [],
            },
            mainCode,
        });

        res.status(201).json({ message: 'Problem created successfully', problem });
    } catch (err) {
        res.status(500).json({ message: 'Error creating problem', error: err.message });
    }
};

