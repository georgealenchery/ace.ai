import type { CodingProblem } from "../services/api";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface TechnicalProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  functionName: string;
  starterCode: Record<string, string>; // keyed by UI language name: "JavaScript", "TypeScript", "Python", etc.
  testCases: Array<{
    input: unknown[];
    expectedOutput: unknown;
  }>;
}

export const TOPIC_CATEGORIES = [
  { id: "arrays",              label: "Arrays & Strings" },
  { id: "hash-maps",           label: "Hash Maps" },
  { id: "linked-lists",        label: "Linked Lists" },
  { id: "trees",               label: "Trees & Graphs" },
  { id: "dynamic-programming", label: "Dynamic Programming" },
  { id: "sorting",             label: "Sorting & Searching" },
  { id: "stacks-queues",       label: "Stacks & Queues" },
  { id: "system-design",       label: "System Design" },
  { id: "recursion",           label: "Recursion & Backtracking" },
  { id: "math",                label: "Math & Logic" },
] as const;

export type TopicId = typeof TOPIC_CATEGORIES[number]["id"];

// ─── Problems ────────────────────────────────────────────────────────────────

export const TECHNICAL_PROBLEMS: TechnicalProblem[] = [

  // ── Easy ──────────────────────────────────────────────────────────────────

  {
    id: "reverse-string",
    title: "Reverse a String",
    difficulty: "Easy",
    topics: ["arrays", "strings"],
    description:
      "Write a function that takes a string and returns it reversed.",
    examples: [
      { input: 's = "hello"', output: '"olleh"' },
      { input: 's = "world"', output: '"dlrow"' },
    ],
    constraints: ["1 ≤ s.length ≤ 10^5"],
    functionName: "reverseString",
    starterCode: {
      JavaScript: `function reverseString(s) {\n  // Your solution here\n\n}`,
      TypeScript: `function reverseString(s: string): string {\n  // Your solution here\n\n}`,
      Python:     `def reverse_string(s: str) -> str:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: ["hello"], expectedOutput: "olleh" },
      { input: ["world"], expectedOutput: "dlrow" },
      { input: ["a"],     expectedOutput: "a" },
    ],
  },

  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "Easy",
    topics: ["math"],
    description:
      'Given an integer n, return an array where each element i (1-indexed) is "FizzBuzz" if divisible by 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, or the number as a string otherwise.',
    examples: [
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]' },
    ],
    constraints: ["1 ≤ n ≤ 10^4"],
    functionName: "fizzBuzz",
    starterCode: {
      JavaScript: `function fizzBuzz(n) {\n  // Your solution here\n\n}`,
      TypeScript: `function fizzBuzz(n: number): string[] {\n  // Your solution here\n\n}`,
      Python:     `def fizz_buzz(n: int) -> list[str]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [3],  expectedOutput: ["1","2","Fizz"] },
      { input: [5],  expectedOutput: ["1","2","Fizz","4","Buzz"] },
      { input: [15], expectedOutput: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"] },
    ],
  },

  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topics: ["stacks-queues"],
    description:
      "Given a string containing only '(', ')', '{', '}', '[', and ']', determine if it is valid. A string is valid if every open bracket is closed by the same type in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 10^4"],
    functionName: "isValid",
    starterCode: {
      JavaScript: `function isValid(s) {\n  // Your solution here\n\n}`,
      TypeScript: `function isValid(s: string): boolean {\n  // Your solution here\n\n}`,
      Python:     `def is_valid(s: str) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: ["()"],     expectedOutput: true  },
      { input: ["()[]{}"], expectedOutput: true  },
      { input: ["(]"],     expectedOutput: false },
      { input: ["([)]"],   expectedOutput: false },
      { input: ["{[]}"],   expectedOutput: true  },
    ],
  },

  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    topics: ["hash-maps", "arrays"],
    description:
      "Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10^5", "-10^9 ≤ nums[i] ≤ 10^9"],
    functionName: "containsDuplicate",
    starterCode: {
      JavaScript: `function containsDuplicate(nums) {\n  // Your solution here\n\n}`,
      TypeScript: `function containsDuplicate(nums: number[]): boolean {\n  // Your solution here\n\n}`,
      Python:     `def contains_duplicate(nums: list[int]) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[1,2,3,1]],     expectedOutput: true  },
      { input: [[1,2,3,4]],     expectedOutput: false },
      { input: [[1,1,1,3,3,4]], expectedOutput: true  },
    ],
  },

  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    topics: ["strings", "arrays"],
    description:
      "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, false otherwise.",
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 2 * 10^5"],
    functionName: "isPalindrome",
    starterCode: {
      JavaScript: `function isPalindrome(s) {\n  // Your solution here\n\n}`,
      TypeScript: `function isPalindrome(s: string): boolean {\n  // Your solution here\n\n}`,
      Python:     `def is_palindrome(s: str) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expectedOutput: true  },
      { input: ["race a car"],                     expectedOutput: false },
      { input: ["Was it a car or a cat I saw?"],   expectedOutput: true  },
    ],
  },

  {
    id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "Easy",
    topics: ["math"],
    description:
      "Given an integer x, return true if x is a palindrome, and false otherwise. An integer is a palindrome when it reads the same forward and backward.",
    examples: [
      { input: "x = 121", output: "true" },
      { input: "x = -121", output: "false", explanation: "From left to right it reads -121, from right to left 121-." },
      { input: "x = 10", output: "false" },
    ],
    constraints: ["-2^31 ≤ x ≤ 2^31 - 1"],
    functionName: "isPalindromeNumber",
    starterCode: {
      JavaScript: `function isPalindromeNumber(x) {\n  // Your solution here\n\n}`,
      TypeScript: `function isPalindromeNumber(x: number): boolean {\n  // Your solution here\n\n}`,
      Python:     `def is_palindrome_number(x: int) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [121],  expectedOutput: true  },
      { input: [-121], expectedOutput: false },
      { input: [10],   expectedOutput: false },
      { input: [0],    expectedOutput: true  },
    ],
  },

  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    topics: ["dynamic-programming", "recursion"],
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1 or 2." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1." },
    ],
    constraints: ["1 ≤ n ≤ 45"],
    functionName: "climbStairs",
    starterCode: {
      JavaScript: `function climbStairs(n) {\n  // Your solution here\n\n}`,
      TypeScript: `function climbStairs(n: number): number {\n  // Your solution here\n\n}`,
      Python:     `def climb_stairs(n: int) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [1], expectedOutput: 1  },
      { input: [2], expectedOutput: 2  },
      { input: [3], expectedOutput: 3  },
      { input: [5], expectedOutput: 8  },
      { input: [10], expectedOutput: 89 },
    ],
  },

  {
    id: "power-of-two",
    title: "Power of Two",
    difficulty: "Easy",
    topics: ["math", "recursion"],
    description:
      "Given an integer n, return true if it is a power of two. An integer n is a power of two if there exists an integer x such that n == 2^x.",
    examples: [
      { input: "n = 1", output: "true",  explanation: "2^0 = 1" },
      { input: "n = 16", output: "true", explanation: "2^4 = 16" },
      { input: "n = 3", output: "false" },
    ],
    constraints: ["-2^31 ≤ n ≤ 2^31 - 1"],
    functionName: "isPowerOfTwo",
    starterCode: {
      JavaScript: `function isPowerOfTwo(n) {\n  // Your solution here\n\n}`,
      TypeScript: `function isPowerOfTwo(n: number): boolean {\n  // Your solution here\n\n}`,
      Python:     `def is_power_of_two(n: int) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [1],  expectedOutput: true  },
      { input: [16], expectedOutput: true  },
      { input: [3],  expectedOutput: false },
      { input: [4],  expectedOutput: true  },
      { input: [5],  expectedOutput: false },
    ],
  },

  {
    id: "max-depth-binary-tree",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    topics: ["trees", "recursion"],
    description:
      "Given a binary tree represented as a level-order (BFS) array where null marks a missing node, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      {
        input: "tree = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The tree has depth 3 (root → 20 → 15 or 7).",
      },
      { input: "tree = [1,null,2]", output: "2" },
    ],
    constraints: ["0 ≤ number of nodes ≤ 10^4", "-100 ≤ Node.val ≤ 100"],
    functionName: "maxDepth",
    starterCode: {
      JavaScript: `/**
 * @param {Array<number|null>} levelOrder - BFS-order array, null = absent node
 * @return {number}
 */
function maxDepth(levelOrder) {
  // Hint: build an explicit tree or process the array level by level.
  // Each level i has nodes at indices 2^i - 1 to 2^(i+1) - 2.

}`,
      TypeScript: `function maxDepth(levelOrder: (number | null)[]): number {\n  // Your solution here\n\n}`,
      Python: `def max_depth(level_order: list[int | None]) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[3,9,20,null,null,15,7]], expectedOutput: 3 },
      { input: [[1,null,2]],             expectedOutput: 2 },
      { input: [[]],                     expectedOutput: 0 },
      { input: [[0]],                    expectedOutput: 1 },
    ],
  },

  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    topics: ["linked-lists", "recursion"],
    description:
      "Given the head of a singly linked list represented as an array of values, reverse it and return the reversed array of values.",
    examples: [
      { input: "list = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "list = [1,2]",       output: "[2,1]" },
    ],
    constraints: ["0 ≤ list.length ≤ 5000", "-5000 ≤ values[i] ≤ 5000"],
    functionName: "reverseList",
    starterCode: {
      JavaScript: `/**
 * @param {number[]} list - array of node values
 * @return {number[]}
 */
function reverseList(list) {
  // Implement as if traversing a linked list: O(n) time, O(1) space.

}`,
      TypeScript: `function reverseList(list: number[]): number[] {\n  // Your solution here\n\n}`,
      Python:     `def reverse_list(lst: list[int]) -> list[int]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[1,2,3,4,5]], expectedOutput: [5,4,3,2,1] },
      { input: [[1,2]],       expectedOutput: [2,1] },
      { input: [[]],          expectedOutput: [] },
    ],
  },

  // ── Medium ────────────────────────────────────────────────────────────────

  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Medium",
    topics: ["hash-maps", "arrays"],
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9." },
      { input: "nums = [3,2,4], target = 6",     output: "[1,2]" },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10^4",
      "-10^9 ≤ nums[i] ≤ 10^9",
      "Exactly one valid answer exists.",
    ],
    functionName: "twoSum",
    starterCode: {
      JavaScript: `function twoSum(nums, target) {\n  // Your solution here\n\n}`,
      TypeScript: `function twoSum(nums: number[], target: number): number[] {\n  // Your solution here\n\n}`,
      Python:     `def two_sum(nums: list[int], target: int) -> list[int]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[2,7,11,15], 9], expectedOutput: [0,1] },
      { input: [[3,2,4], 6],     expectedOutput: [1,2] },
      { input: [[3,3], 6],       expectedOutput: [0,1] },
    ],
  },

  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    topics: ["sorting", "arrays"],
    description:
      "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "[1,3] and [2,6] overlap → merge to [1,6].",
      },
    ],
    constraints: ["1 ≤ intervals.length ≤ 10^4"],
    functionName: "merge",
    starterCode: {
      JavaScript: `function merge(intervals) {\n  // Your solution here\n\n}`,
      TypeScript: `function merge(intervals: number[][]): number[][] {\n  // Your solution here\n\n}`,
      Python:     `def merge(intervals: list[list[int]]) -> list[list[int]]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[[1,3],[2,6],[8,10],[15,18]]], expectedOutput: [[1,6],[8,10],[15,18]] },
      { input: [[[1,4],[4,5]]],               expectedOutput: [[1,5]] },
      { input: [[[1,4],[2,3]]],               expectedOutput: [[1,4]] },
    ],
  },

  {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    topics: ["hash-maps", "strings", "sorting"],
    description:
      "Given an array of strings, group the anagrams together. Return the total number of groups.",
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: "3",
        explanation: 'Three groups: ["eat","tea","ate"], ["tan","nat"], ["bat"].',
      },
    ],
    constraints: ["1 ≤ strs.length ≤ 10^4", "strs[i] consists of lowercase English letters."],
    functionName: "groupAnagramsCount",
    starterCode: {
      JavaScript: `/**
 * Return the number of distinct anagram groups.
 * @param {string[]} strs
 * @return {number}
 */
function groupAnagramsCount(strs) {
  // Hint: use a hash map keyed by sorted characters.

}`,
      TypeScript: `function groupAnagramsCount(strs: string[]): number {\n  // Your solution here\n\n}`,
      Python:     `def group_anagrams_count(strs: list[str]) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [["eat","tea","tan","ate","nat","bat"]], expectedOutput: 3 },
      { input: [[""]],                                  expectedOutput: 1 },
      { input: [["a"]],                                 expectedOutput: 1 },
      { input: [["a","b","c"]],                         expectedOutput: 3 },
    ],
  },

  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    topics: ["arrays", "dynamic-programming"],
    description:
      "Given an integer array nums, find the subarray with the largest sum and return its sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "[4,-1,2,1] has the largest sum = 6.",
      },
      { input: "nums = [1]",          output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10^5", "-10^4 ≤ nums[i] ≤ 10^4"],
    functionName: "maxSubArray",
    starterCode: {
      JavaScript: `function maxSubArray(nums) {\n  // Your solution here (Kadane's algorithm)\n\n}`,
      TypeScript: `function maxSubArray(nums: number[]): number {\n  // Your solution here\n\n}`,
      Python:     `def max_sub_array(nums: list[int]) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[-2,1,-3,4,-1,2,1,-5,4]], expectedOutput: 6  },
      { input: [[1]],                      expectedOutput: 1  },
      { input: [[5,4,-1,7,8]],             expectedOutput: 23 },
      { input: [[-1]],                     expectedOutput: -1 },
    ],
  },

  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topics: ["strings", "hash-maps"],
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: '"abc" is the longest.' },
      { input: 's = "bbbbb"',    output: "1" },
      { input: 's = "pwwkew"',   output: "3", explanation: '"wke" is valid.' },
    ],
    constraints: ["0 ≤ s.length ≤ 5 * 10^4"],
    functionName: "lengthOfLongestSubstring",
    starterCode: {
      JavaScript: `function lengthOfLongestSubstring(s) {\n  // Hint: sliding window with a hash map\n\n}`,
      TypeScript: `function lengthOfLongestSubstring(s: string): number {\n  // Your solution here\n\n}`,
      Python:     `def length_of_longest_substring(s: str) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: ["abcabcbb"], expectedOutput: 3 },
      { input: ["bbbbb"],    expectedOutput: 1 },
      { input: ["pwwkew"],   expectedOutput: 3 },
      { input: [""],         expectedOutput: 0 },
    ],
  },

  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    topics: ["dynamic-programming"],
    description:
      "You are given an integer array coins representing coin denominations and an integer amount. Return the fewest number of coins needed to make up that amount. If it cannot be made up, return -1.",
    examples: [
      { input: "coins = [1,5,11], amount = 15", output: "3",  explanation: "11 + 3×1 is not optimal; 5+5+5 = 15 uses 3 coins." },
      { input: "coins = [2], amount = 3",       output: "-1" },
    ],
    constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2^31 - 1", "0 ≤ amount ≤ 10^4"],
    functionName: "coinChange",
    starterCode: {
      JavaScript: `function coinChange(coins, amount) {\n  // Classic DP: build up from 0 to amount\n\n}`,
      TypeScript: `function coinChange(coins: number[], amount: number): number {\n  // Your solution here\n\n}`,
      Python:     `def coin_change(coins: list[int], amount: int) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[1,5,11], 15], expectedOutput: 3  },
      { input: [[2], 3],       expectedOutput: -1 },
      { input: [[1], 0],       expectedOutput: 0  },
      { input: [[1,2,5], 11],  expectedOutput: 3  },
    ],
  },

  {
    id: "sort-colors",
    title: "Sort Colors",
    difficulty: "Medium",
    topics: ["sorting", "arrays"],
    description:
      "Given an array nums containing 0s, 1s, and 2s (representing red, white, and blue), sort them in-place so that objects of the same color are adjacent. Follow up: use the Dutch National Flag algorithm (one pass, O(1) space).",
    examples: [
      { input: "nums = [2,0,2,1,1,0]", output: "[0,0,1,1,2,2]" },
      { input: "nums = [2,0,1]",        output: "[0,1,2]" },
    ],
    constraints: ["1 ≤ nums.length ≤ 300", "nums[i] is 0, 1, or 2"],
    functionName: "sortColors",
    starterCode: {
      JavaScript: `function sortColors(nums) {\n  // Sort in-place and return the array\n\n  return nums;\n}`,
      TypeScript: `function sortColors(nums: number[]): number[] {\n  // Sort in-place and return the array\n\n  return nums;\n}`,
      Python:     `def sort_colors(nums: list[int]) -> list[int]:\n    # Sort in-place and return\n    pass`,
    },
    testCases: [
      { input: [[2,0,2,1,1,0]], expectedOutput: [0,0,1,1,2,2] },
      { input: [[2,0,1]],        expectedOutput: [0,1,2] },
      { input: [[0]],            expectedOutput: [0] },
    ],
  },

  {
    id: "rotate-array",
    title: "Rotate Array",
    difficulty: "Medium",
    topics: ["arrays"],
    description:
      "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Return the rotated array.",
    examples: [
      { input: "nums = [1,2,3,4,5,6,7], k = 3", output: "[5,6,7,1,2,3,4]" },
      { input: "nums = [-1,-100,3,99], k = 2",   output: "[3,99,-1,-100]" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10^5", "0 ≤ k ≤ 10^5"],
    functionName: "rotate",
    starterCode: {
      JavaScript: `function rotate(nums, k) {\n  // Rotate in-place (or return a new array) — your choice\n\n  return nums;\n}`,
      TypeScript: `function rotate(nums: number[], k: number): number[] {\n  return nums;\n}`,
      Python:     `def rotate(nums: list[int], k: int) -> list[int]:\n    pass`,
    },
    testCases: [
      { input: [[1,2,3,4,5,6,7], 3], expectedOutput: [5,6,7,1,2,3,4] },
      { input: [[-1,-100,3,99], 2],   expectedOutput: [3,99,-1,-100] },
      { input: [[1,2], 3],            expectedOutput: [2,1] },
    ],
  },

  {
    id: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Medium",
    topics: ["linked-lists", "sorting"],
    description:
      "You are given two sorted arrays (representing linked lists). Merge them into one sorted array and return it.",
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = [0]",           output: "[0]" },
    ],
    constraints: ["0 ≤ list.length ≤ 50", "-100 ≤ values[i] ≤ 100"],
    functionName: "mergeTwoLists",
    starterCode: {
      JavaScript: `function mergeTwoLists(list1, list2) {\n  // Merge as if they were linked lists (use pointers/indices)\n\n}`,
      TypeScript: `function mergeTwoLists(list1: number[], list2: number[]): number[] {\n  // Your solution here\n\n}`,
      Python:     `def merge_two_lists(list1: list[int], list2: list[int]) -> list[int]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[1,2,4], [1,3,4]], expectedOutput: [1,1,2,3,4,4] },
      { input: [[], [0]],          expectedOutput: [0] },
      { input: [[], []],           expectedOutput: [] },
    ],
  },

  {
    id: "level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topics: ["trees", "stacks-queues"],
    description:
      "Given a binary tree represented as a level-order (BFS) array where null marks a missing node, return its level-order traversal as an array of arrays.",
    examples: [
      {
        input: "tree = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
      },
    ],
    constraints: ["0 ≤ nodes ≤ 2000"],
    functionName: "levelOrder",
    starterCode: {
      JavaScript: `/**
 * @param {Array<number|null>} levelOrder - BFS array, null = absent
 * @return {number[][]}
 */
function levelOrder(levelOrderArr) {
  // Build the tree from the array, then do BFS.

}`,
      TypeScript: `function levelOrder(levelOrderArr: (number | null)[]): number[][] {\n  // Your solution here\n\n}`,
      Python:     `def level_order(level_order_arr: list[int | None]) -> list[list[int]]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[3,9,20,null,null,15,7]], expectedOutput: [[3],[9,20],[15,7]] },
      { input: [[1]],                     expectedOutput: [[1]] },
      { input: [[]],                      expectedOutput: [] },
    ],
  },

  // ── Hard ──────────────────────────────────────────────────────────────────

  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Hard",
    topics: ["hash-maps", "stacks-queues", "linked-lists"],
    description:
      "Design a data structure that follows LRU (Least Recently Used) cache constraints.\nImplement a function lruCacheOps(capacity, operations, values) that processes a list of operations ('get' | 'put') and returns the output of each 'get' call (-1 if key not found). For 'put', null is returned.\n\nEviction rule: when capacity is exceeded, evict the least recently used key.",
    examples: [
      {
        input: "capacity=2, ops=['put','put','get','put','get','put','get','get','get'], vals=[1,1; 2,2; 1; 3,3; 2; 4,4; 1; 3; 4]",
        output: "[null,null,1,null,-1,null,-1,3,4]",
        explanation: "After put(1,1),put(2,2),get(1)→1; put(3,3) evicts key 2; get(2)→-1; put(4,4) evicts key 1; etc.",
      },
    ],
    constraints: ["1 ≤ capacity ≤ 3000"],
    functionName: "lruCacheOps",
    starterCode: {
      JavaScript: `/**
 * @param {number} capacity
 * @param {string[]} ops - array of 'get' or 'put'
 * @param {number[][]} vals - args for each op: [key] for get, [key,value] for put
 * @return {(number|null)[]}
 */
function lruCacheOps(capacity, ops, vals) {
  // Build an LRU cache and run each operation.
  // Return an array of results: null for 'put', value (or -1) for 'get'.

}`,
      TypeScript: `function lruCacheOps(capacity: number, ops: string[], vals: number[][]): (number | null)[] {\n  // Your solution here\n\n}`,
      Python:     `def lru_cache_ops(capacity: int, ops: list[str], vals: list[list[int]]) -> list[int | None]:\n    # Your solution here\n    pass`,
    },
    testCases: [
      {
        input: [2, ["put","put","get","put","get","put","get","get","get"], [[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]],
        expectedOutput: [null,null,1,null,-1,null,-1,3,4],
      },
    ],
  },

  {
    id: "median-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topics: ["sorting", "arrays", "math"],
    description:
      "Given two sorted arrays nums1 and nums2, return the median of the combined sorted array. The overall run time complexity should be O(log(m+n)).",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]",  output: "2.0",   explanation: "Merged: [1,2,3], median is 2." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5", explanation: "Merged: [1,2,3,4], median is (2+3)/2 = 2.5." },
    ],
    constraints: ["0 ≤ m, n ≤ 1000", "1 ≤ m + n ≤ 2000"],
    functionName: "findMedianSortedArrays",
    starterCode: {
      JavaScript: `function findMedianSortedArrays(nums1, nums2) {\n  // Binary search on the smaller array\n\n}`,
      TypeScript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  // Your solution here\n\n}`,
      Python:     `def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[1,3], [2]],   expectedOutput: 2.0 },
      { input: [[1,2], [3,4]], expectedOutput: 2.5 },
    ],
  },

  {
    id: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    difficulty: "Hard",
    topics: ["dynamic-programming", "strings", "recursion"],
    description:
      "Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is a sequence that appears in the same relative order but not necessarily contiguously.",
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: '"ace" is a common subsequence.' },
      { input: 'text1 = "abc", text2 = "abc"',   output: "3" },
      { input: 'text1 = "abc", text2 = "def"',   output: "0" },
    ],
    constraints: ["1 ≤ text1.length, text2.length ≤ 1000"],
    functionName: "longestCommonSubsequence",
    starterCode: {
      JavaScript: `function longestCommonSubsequence(text1, text2) {\n  // Classic 2D DP: dp[i][j] = LCS of text1[0..i] and text2[0..j]\n\n}`,
      TypeScript: `function longestCommonSubsequence(text1: string, text2: string): number {\n  // Your solution here\n\n}`,
      Python:     `def longest_common_subsequence(text1: str, text2: str) -> int:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: ["abcde", "ace"], expectedOutput: 3 },
      { input: ["abc",   "abc"], expectedOutput: 3 },
      { input: ["abc",   "def"], expectedOutput: 0 },
      { input: ["bl",    "yby"], expectedOutput: 1 },
    ],
  },

  {
    id: "word-search",
    title: "Word Search",
    difficulty: "Hard",
    topics: ["trees", "recursion"],
    description:
      "Given an m x n grid of characters and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically adjacent). The same cell may not be used more than once.",
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: "true",
      },
    ],
    constraints: ["m == board.length", "n == board[i].length", "1 ≤ m, n ≤ 6"],
    functionName: "exist",
    starterCode: {
      JavaScript: `/**
 * @param {string[][]} board
 * @param {string} word
 * @return {boolean}
 */
function exist(board, word) {
  // DFS + backtracking from each starting cell

}`,
      TypeScript: `function exist(board: string[][], word: string): boolean {\n  // Your solution here\n\n}`,
      Python:     `def exist(board: list[list[str]], word: str) -> bool:\n    # Your solution here\n    pass`,
    },
    testCases: [
      { input: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"], expectedOutput: true  },
      { input: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "SEE"],    expectedOutput: true  },
      { input: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"],   expectedOutput: false },
    ],
  },

];

// ─── Conversion ───────────────────────────────────────────────────────────────

/** Convert a TechnicalProblem to the CodingProblem shape used by TechnicalCodeEditor. */
export function toCodingProblem(p: TechnicalProblem, language = "JavaScript"): CodingProblem {
  const signature =
    p.starterCode[language] ??
    p.starterCode["JavaScript"] ??
    Object.values(p.starterCode)[0] ??
    "";

  return {
    prompt: p.description,
    functionName: p.functionName,
    functionSignature: signature,
    testCases: p.testCases as CodingProblem["testCases"],
  };
}

// ─── Filtering helpers ────────────────────────────────────────────────────────

export function getDifficulty(difficultyValue: number): Difficulty {
  if (difficultyValue <= 30) return "Easy";
  if (difficultyValue <= 60) return "Medium";
  return "Hard";
}

/**
 * Filter problems by difficulty and optionally by topics.
 * If no topics are given (or none match), falls back to difficulty-only filter.
 */
export function filterProblems(
  difficultyValue: number,
  topics: string[] = [],
): TechnicalProblem[] {
  const difficulty = getDifficulty(difficultyValue);
  const byDifficulty = TECHNICAL_PROBLEMS.filter((p) => p.difficulty === difficulty);

  if (topics.length === 0) return byDifficulty;

  // Exclude system-design from code problems (it's only a prompt hint for the AI)
  const codeTopics = topics.filter((t) => t !== "system-design");
  if (codeTopics.length === 0) return byDifficulty;

  const byTopics = byDifficulty.filter((p) =>
    codeTopics.some((t) => p.topics.includes(t))
  );

  return byTopics.length > 0 ? byTopics : byDifficulty;
}

/**
 * Pick `count` distinct random problems from the filtered set.
 * Falls back gracefully if fewer problems are available.
 */
export function pickRandomProblems(
  difficultyValue: number,
  topics: string[] = [],
  count = 3,
): TechnicalProblem[] {
  const pool = filterProblems(difficultyValue, topics);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
