'use strict';

const DEFAULT_CHALLENGES = [
    'Teach your partner a word in a language they don\'t speak.',
    'Tell your partner your most embarrassing moment.',
    'Describe your dream travel destination.',
    'Share a fun fact about your hometown.',
    'What\'s one thing you\'re proud of that most people don\'t know?',
    'Describe a movie using only emojis.',
    'What would be the title of your autobiography?',
    'If you could have dinner with anyone, who would it be and why?',
    'Tell a joke — the worse the better.',
    'What\'s on your current playlist?',
];

class ChallengeService {
    async getRandomChallenge() {
        const text = DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)];
        return { challengeId: null, text, tags: [] };
    }
}

module.exports = ChallengeService;
