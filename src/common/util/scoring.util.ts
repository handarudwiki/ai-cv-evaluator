interface CvEval {
    Technical_skills: number;
    Experience_level: number;
    Relevant_achievements: number;
    Cultural_fit: number;
}

interface ProjectEval {
    correctness: number;
    codeQuality: number;
    resilience: number;
    documentation: number;
    creativity: number;
}

export function calculateCVMatchRate(cvEval: CvEval): number {
    const weights = {
        technical_skills: 0.4,
        experience_level: 0.25,
        relevant_achievements: 0.20,
        cultural_fit: 0.15,
    }

    const weightSum = cvEval.Technical_skills * weights.technical_skills +
        cvEval.Experience_level * weights.experience_level +
        cvEval.Relevant_achievements * weights.relevant_achievements +
        cvEval.Cultural_fit * weights.cultural_fit;

    const matchRate = (weightSum - 1) / 4;

    return Math.round(matchRate * 100)/100;

}

export function calculateProjectScore(projectScore: ProjectEval): number {
    const weights = {
        correctness: 0.30,
        codeQuality: 0.25,
        resilience: 0.20,
        documentation: 0.15,
        creativity: 0.10,
    }

    const weightSum = projectScore.correctness * weights.correctness +
        projectScore.codeQuality * weights.codeQuality +
        projectScore.resilience * weights.resilience +
        projectScore.documentation * weights.documentation +
        projectScore.creativity * weights.creativity;

    return Math.round(weightSum * 100) / 100;
}

export function calculateOveralSore(
    cvMatchRate,
    projectScore: number
) : number {
    const cvScore = cvMatchRate * 4 - 1;

    const overall = (cvScore + projectScore) / 2;

    return Math.round(overall * 100) / 100;
}