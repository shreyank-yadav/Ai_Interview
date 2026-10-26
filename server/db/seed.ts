/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcryptjs';
import { CodingProblem, TanyaPersonaConfig, User, ParsedResume, InterviewSession } from './schema.ts';

// Deterministic bcrypt hashes for default demo accounts (demo123, admin123)
const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123', 10);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);

export const SEED_USERS: User[] = [
  {
    id: 'user_candidate_1',
    email: 'candidate@tanya-ai.com',
    name: 'Alex Mercer',
    role: 'candidate',
    subscriptionTier: 'premium',
    interviewCreditsRemaining: 15,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-15T10:00:00Z',
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: 'user_admin_1',
    email: 'admin@tanya-ai.com',
    name: 'Sarah Connor (Admin)',
    role: 'admin',
    subscriptionTier: 'premium',
    interviewCreditsRemaining: 9999,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01T08:00:00Z',
    passwordHash: ADMIN_PASSWORD_HASH,
  },
  {
    id: 'user_free_1',
    email: 'free@tanya-ai.com',
    name: 'David Patel',
    role: 'candidate',
    subscriptionTier: 'free',
    interviewCreditsRemaining: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-01T14:30:00Z',
    passwordHash: DEMO_PASSWORD_HASH,
  }
];

export const DEFAULT_TANYA_PERSONA: TanyaPersonaConfig = {
  name: 'Tanya',
  avatarPreset: 'professional',
  customAvatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&auto=format&fit=crop&q=80',
  tone: 'neutral',
  speakingSpeed: 1.0,
  voiceName: 'Kore',
  rigorLevel: 'standard',
  enableFollowUpProbing: true,
  welcomeMessage: "Hello! I am Tanya, your AI interviewer today. I'll be assessing your technical depth, problem-solving structure, and communication. Take a breath, speak clearly, and let's get started whenever you're ready.",
};

export const SEED_CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob_two_sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array / Hash Table',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]'
      }
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test execution:
print(two_sum([2, 7, 11, 15], 9))
`,
      javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) {
            return [map.get(comp), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) {
            return [map.get(comp)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int comp = target - nums[i];
        if (seen.find(comp) != seen.end()) {
            return {seen[comp], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    auto ans = twoSum(nums, 9);
    std::cout << "[" << ans[0] << "," << ans[1] << "]" << std::endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                return new int[]{map.get(comp), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        int[] res = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(res));
    }
}
`
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' }
    ]
  },
  {
    id: 'prob_valid_parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack / String',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.",
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only ()[]{}'],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    starterCode: {
      python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

print(is_valid("()[]{}"))
`,
      javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (let char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}

console.log(isValid("()[]{}"));
`,
      typescript: `function isValid(s: string): boolean {
    const stack: string[] = [];
    const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
    for (let char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}

console.log(isValid("()[]{}"));
`,
      cpp: `#include <iostream>
#include <stack>
#include <unordered_map>

bool isValid(std::string s) {
    std::stack<char> st;
    std::unordered_map<char, char> map = {{')', '('}, {'}', '{'}, {']', '['}};
    for (char c : s) {
        if (map.count(c)) {
            if (st.empty() || st.top() != map[c]) return false;
            st.pop();
        } else {
            st.push(c);
        }
    }
    return st.empty();
}

int main() {
    std::cout << (isValid("()[]{}") ? "true" : "false") << std::endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Solution {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(isValid("()[]{}"));
    }
}
`
    },
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' },
      { input: '"([)]"', expectedOutput: 'false' }
    ]
  },
  {
    id: 'prob_lru_cache',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    category: 'Design / Linked List / Map',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get(key) and put(key, value) operations running in O(1) average time complexity.',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.'
    ],
    examples: [
      {
        input: 'LRUCache lRUCache = new LRUCache(2); lRUCache.put(1, 1); lRUCache.put(2, 2); lRUCache.get(1); // returns 1',
        output: '1'
      }
    ],
    starterCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            next_key = next(iter(self.cache))
            del self.cache[next_key]
        self.cache[key] = value

cache = LRUCache(2)
cache.put(1, 10)
cache.put(2, 20)
print(cache.get(1))
cache.put(3, 30)
print(cache.get(2)) # Should be -1 (evicted)
`,
      javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
    }
    get(key) {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.capacity) {
            this.map.delete(this.map.keys().next().value);
        }
        this.map.set(key, value);
    }
}

const cache = new LRUCache(2);
cache.put(1, 10);
cache.put(2, 20);
console.log(cache.get(1));
cache.put(3, 30);
console.log(cache.get(2));
`,
      typescript: `class LRUCache {
    private capacity: number;
    private map: Map<number, number>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.map = new Map();
    }

    get(key: number): number {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key)!;
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }

    put(key: number, value: number): void {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.capacity) {
            this.map.delete(this.map.keys().next().value!);
        }
        this.map.set(key, value);
    }
}

const cache = new LRUCache(2);
cache.put(1, 10);
cache.put(2, 20);
console.log(cache.get(1));
`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <list>

class LRUCache {
    int cap;
    std::list<std::pair<int, int>> lru;
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> map;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        if (map.find(key) == map.end()) return -1;
        lru.splice(lru.begin(), lru, map[key]);
        return map[key]->second;
    }
    void put(int key, int value) {
        if (map.find(key) != map.end()) {
            lru.splice(lru.begin(), lru, map[key]);
            map[key]->second = value;
            return;
        }
        if (lru.size() == cap) {
            int delKey = lru.back().first;
            lru.pop_back();
            map.erase(delKey);
        }
        lru.emplace_front(key, value);
        map[key] = lru.begin();
    }
};

int main() {
    LRUCache c(2);
    c.put(1, 1);
    c.put(2, 2);
    std::cout << c.get(1) << std::endl;
    return 0;
}
`,
      java: `import java.util.*;

public class LRUCache extends LinkedHashMap<Integer, Integer> {
    private int capacity;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }
    public int get(int key) {
        return super.getOrDefault(key, -1);
    }
    public void put(int key, int value) {
        super.put(key, value);
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
    public static void main(String[] args) {
        LRUCache cache = new LRUCache(2);
        cache.put(1, 1);
        System.out.println(cache.get(1));
    }
}
`
    },
    testCases: [
      { input: 'get(1)', expectedOutput: '1' },
      { input: 'get(2)', expectedOutput: '-1' }
    ]
  }
];

export const SEED_RESUMES: ParsedResume[] = [
  {
    id: 'resume_alex_1',
    userId: 'user_candidate_1',
    fileName: 'Alex_Mercer_FullStack_2026.pdf',
    fileSize: 184500,
    uploadedAt: '2026-10-18T11:20:00Z',
    candidateName: 'Alex Mercer',
    candidateEmail: 'alex.mercer@gmail.com',
    summary: 'Senior Software Engineer with 6+ years of experience designing high-throughput distributed microservices in Go, TypeScript, React, and AWS. Reduced latency by 45% on core checkout services.',
    experienceYears: 6,
    atsScore: 88,
    extractedSkills: [
      'React', 'TypeScript', 'Node.js', 'Go', 'PostgreSQL', 'Redis',
      'Docker', 'Kubernetes', 'AWS (Lambda, SQS, S3)', 'GraphQL', 'System Design'
    ],
    experienceHighlights: [
      'Engineered real-time distributed notification service handling 120k events/sec using Kafka & Redis.',
      'Spearheaded frontend migration from legacy monolithic architecture to Next.js micro-frontends.',
      'Mentored 4 junior engineers and instituted rigorous automated CI/CD pipeline reducing build failures by 35%.'
    ],
    education: [
      'B.S. in Computer Science - University of Washington (2020)'
    ],
    potentialGaps: [
      'Limited explicit mention of automated end-to-end testing frameworks (e.g. Playwright / Cypress).',
      'Could quantify budget impact or financial ROI on infrastructure optimization.'
    ],
    tailoredQuestions: [
      'You mentioned handling 120k events/sec using Kafka and Redis. How did you handle consumer group rebalancing and partition lag during traffic surges?',
      'Walk Tanya through your decision matrix when choosing between Go microservices and Node.js for high-concurrency workloads.',
      'Describe a situation where a frontend micro-frontend deployed an incompatible breaking API change and how you mitigated customer downtime.'
    ],
    rawTextPreview: 'Alex Mercer | Senior Full-Stack Engineer | alex.mercer@gmail.com | github.com/alexmercer ...',
    sourceType: 'file_upload',
    storedFilePath: './data/uploads/Alex_Mercer_FullStack_2026.pdf',
  }
];

export const SEED_COMPLETED_SESSION: InterviewSession = {
  id: 'session_demo_completed',
  userId: 'user_candidate_1',
  type: 'technical',
  roleTarget: 'Senior Backend / Cloud Architect',
  difficulty: 'senior',
  status: 'completed',
  startedAt: '2026-10-22T14:00:00Z',
  completedAt: '2026-10-22T14:28:00Z',
  currentQuestionIndex: 3,
  totalQuestions: 3,
  questions: [
    {
      id: 'q_1',
      text: 'How do you guarantee idempotency in a distributed payment system when network timeouts occur between the client, your server, and the payment gateway?',
      category: 'System Design & Fault Tolerance',
      expectedKeyPoints: [
        'Client-generated idempotency key (UUID v4)',
        'Distributed lock (Redis/Redlock or DB unique constraint)',
        'Two-phase commit or transactional outbox pattern',
        'State reconciliation worker / Webhook signature verification'
      ]
    },
    {
      id: 'q_2',
      text: 'Explain the difference between optimistic concurrency control and pessimistic locking. When would you choose one over the other in a high-concurrency booking engine?',
      category: 'Database Concurrency',
      expectedKeyPoints: [
        'Version column / ETag for optimistic vs SELECT FOR UPDATE for pessimistic',
        'Collision frequency trade-off (read-heavy vs write-contention)',
        'Rollback retry logic and deadlocks'
      ]
    },
    {
      id: 'q_3',
      text: 'Can you describe a time you identified a critical production bottleneck and the precise observability telemetry you used to resolve it?',
      category: 'Behavioral & Production Engineering',
      expectedKeyPoints: [
        'Distributed tracing (OpenTelemetry, Jaeger)',
        'Flame graphs, CPU profiles, or slow query logs',
        'Root cause remediation and post-mortem'
      ]
    }
  ],
  messages: [
    {
      id: 'm_1',
      sender: 'tanya',
      text: "Welcome Alex! Let's examine distributed system reliability. First question: How do you guarantee idempotency in a distributed payment system when network timeouts occur between the client, your server, and the payment gateway?",
      timestamp: '2026-10-22T14:01:00Z'
    },
    {
      id: 'm_2',
      sender: 'candidate',
      text: "To ensure idempotency, I enforce client-generated idempotency keys (UUID v4) on every checkout request. On our API gateway, we check Redis with an atomic SETNX key with a 120-second TTL. If already processing, we return HTTP 409 or stream the existing status. In the PostgreSQL ledger, we enforce a UNIQUE constraint on the order's idempotency key. When communicating with Razorpay/Stripe, we pass that key directly so retried charges don't bill the user twice. Finally, we implement an Outbox Pattern with asynchronous webhook reconciliation.",
      timestamp: '2026-10-22T14:04:15Z'
    },
    {
      id: 'm_3',
      sender: 'tanya',
      text: "Excellent architectural breakdown Alex. The atomic Redis lock coupled with database constraints is textbook. Now let's dive into data storage: Explain the difference between optimistic concurrency control and pessimistic locking. When would you choose one over the other in a high-concurrency booking engine?",
      timestamp: '2026-10-22T14:04:30Z'
    }
  ],
  report: {
    id: 'report_demo_1',
    sessionId: 'session_demo_completed',
    overallScore: 92,
    recommendation: 'Strong Hire',
    summary: 'Alex demonstrated exceptional technical mastery of distributed systems, concurrency control, and telemetry. Answers were articulated systematically with concrete real-world tradeoffs.',
    categoryScores: {
      technicalAccuracy: 95,
      communicationClarity: 90,
      problemSolving: 92,
      culturalAlignment: 88,
    },
    keyStrengths: [
      'Comprehensive understanding of idempotency patterns and distributed transaction atomicity.',
      'Clear articulation of tradeoff matrices between optimistic vs pessimistic locking.',
      'Disciplined focus on observability metrics (p99 latency, distributed traces).'
    ],
    growthAreas: [
      'Could elaborate further on disaster recovery and database split-brain failover mechanisms.',
      'Briefly mentioned Redis locks without clarifying redlock edge cases across clock skews.'
    ],
    questionEvaluations: [
      {
        questionId: 'q_1',
        questionText: 'How do you guarantee idempotency in a distributed payment system?',
        candidateAnswer: 'To ensure idempotency, I enforce client-generated idempotency keys...',
        score: 96,
        clarityScore: 95,
        technicalAccuracyScore: 98,
        depthScore: 95,
        strengths: ['Identified client-side key generation, Redis SETNX atomic locks, and database unique constraints.'],
        improvements: ['Could mention how client timeouts are handled when payment gateway processing exceeds API gateway timeouts.'],
        idealAnswer: 'Enforce UUIDv4 idempotency keys passed in headers; acquire atomic distributed lock; query DB for existing record; pass idempotency key to downstream PSP; verify webhook asynchronously; update outbox table in single transaction.'
      }
    ],
    generatedAt: '2026-10-22T14:28:10Z'
  }
};
