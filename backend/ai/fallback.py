"""
Deterministic Fallback Extractor for SkillSync AI
-------------------------------------------------
Guarantees 100% offline uptime, zero API dependency, zero hallucinated evidence,
and rigorous distinction between VERIFIED and UNVERIFIED skills.

Features:
- Regex-based skill recognition across 40+ industry skills in 6 categories
- Verbatim quote capture for verified skills
- Explicit UNVERIFIED state with evidence=None for buzzword list claims
- Prompt injection defense and instruction neutralization
- Zero demographic extraction for fair evaluation
"""

import re
import datetime
from typing import List, Dict, Tuple, Optional
from backend.ai.schemas import (
    VerificationStatus,
    ProficiencyLevel,
    SkillCategory,
    ExtractedSkill,
    EmployeeProfile,
    ProjectSkillRequirement,
    ProjectRequirement,
    ExtractionMetadata,
    EmployeeExtractionEnvelope,
    ProjectExtractionEnvelope,
)

# Comprehensive curated taxonomy with canonical names, categories, and regex patterns
SKILL_TAXONOMY: Dict[str, Dict] = {
    # Programming Languages
    "python": {"canonical": "Python", "category": SkillCategory.TECHNICAL, "regex": r"\bpython\b"},
    "javascript": {"canonical": "JavaScript", "category": SkillCategory.TECHNICAL, "regex": r"\b(javascript|js|es6)\b"},
    "typescript": {"canonical": "TypeScript", "category": SkillCategory.TECHNICAL, "regex": r"\b(typescript|ts)\b"},
    "go": {"canonical": "Go", "category": SkillCategory.TECHNICAL, "regex": r"\b(golang|go\s+language)\b"},
    "java": {"canonical": "Java", "category": SkillCategory.TECHNICAL, "regex": r"\bjava\b(?!script)"},
    "c++": {"canonical": "C++", "category": SkillCategory.TECHNICAL, "regex": r"\b(c\+\+|cpp)\b"},
    "c#": {"canonical": "C#", "category": SkillCategory.TECHNICAL, "regex": r"\b(c#|csharp)\b"},
    "rust": {"canonical": "Rust", "category": SkillCategory.TECHNICAL, "regex": r"\brust\b"},
    "sql": {"canonical": "SQL", "category": SkillCategory.TECHNICAL, "regex": r"\bsql\b"},
    "html": {"canonical": "HTML", "category": SkillCategory.TECHNICAL, "regex": r"\b(html|html5)\b"},
    "css": {"canonical": "CSS", "category": SkillCategory.TECHNICAL, "regex": r"\b(css|css3)\b"},
    "bash": {"canonical": "Bash", "category": SkillCategory.TECHNICAL, "regex": r"\b(bash|shell\s+scripting)\b"},

    # Frameworks & Libraries
    "react": {"canonical": "React", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(react|react\.js|reactjs)\b"},
    "vue": {"canonical": "Vue.js", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(vue|vue\.js|vuejs)\b"},
    "angular": {"canonical": "Angular", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bangular\b"},
    "node.js": {"canonical": "Node.js", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(node|node\.js|nodejs)\b"},
    "express": {"canonical": "Express.js", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(express|express\.js)\b"},
    "fastapi": {"canonical": "FastAPI", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bfastapi\b"},
    "django": {"canonical": "Django", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bdjango\b"},
    "flask": {"canonical": "Flask", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bflask\b"},
    "next.js": {"canonical": "Next.js", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(next\.js|nextjs)\b"},
    "spring boot": {"canonical": "Spring Boot", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(spring\s+boot|springboot)\b"},
    "pytorch": {"canonical": "PyTorch", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(pytorch|torch)\b"},
    "tensorflow": {"canonical": "TensorFlow", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\btensorflow\b"},
    "pandas": {"canonical": "Pandas", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bpandas\b"},
    "numpy": {"canonical": "NumPy", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\bnumpy\b"},
    "scikit-learn": {"canonical": "Scikit-Learn", "category": SkillCategory.FRAMEWORK_OR_TOOL, "regex": r"\b(scikit-learn|sklearn)\b"},

    # Databases
    "postgresql": {"canonical": "PostgreSQL", "category": SkillCategory.DATABASE, "regex": r"\b(postgresql|postgres)\b"},
    "mysql": {"canonical": "MySQL", "category": SkillCategory.DATABASE, "regex": r"\bmysql\b"},
    "mongodb": {"canonical": "MongoDB", "category": SkillCategory.DATABASE, "regex": r"\b(mongodb|mongo)\b"},
    "redis": {"canonical": "Redis", "category": SkillCategory.DATABASE, "regex": r"\bredis\b"},
    "sqlite": {"canonical": "SQLite", "category": SkillCategory.DATABASE, "regex": r"\bsqlite\b"},
    "elasticsearch": {"canonical": "Elasticsearch", "category": SkillCategory.DATABASE, "regex": r"\belasticsearch\b"},

    # DevOps & Cloud
    "docker": {"canonical": "Docker", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\bdocker\b"},
    "kubernetes": {"canonical": "Kubernetes", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(kubernetes|k8s)\b"},
    "aws": {"canonical": "AWS", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(aws|amazon\s+web\s+services)\b"},
    "gcp": {"canonical": "GCP", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(gcp|google\s+cloud)\b"},
    "azure": {"canonical": "Azure", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(azure|microsoft\s+azure)\b"},
    "ci/cd": {"canonical": "CI/CD", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(ci/cd|continuous\s+integration|github\s+actions|jenkins)\b"},
    "git": {"canonical": "Git", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\b(git|github|gitlab)\b"},
    "terraform": {"canonical": "Terraform", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\bterraform\b"},
    "linux": {"canonical": "Linux", "category": SkillCategory.DEVOPS_CLOUD, "regex": r"\blinux\b"},

    # Soft Skills & Leadership
    "agile": {"canonical": "Agile", "category": SkillCategory.SOFT_SKILL, "regex": r"\b(agile|scrum|kanban)\b"},
    "leadership": {"canonical": "Leadership", "category": SkillCategory.SOFT_SKILL, "regex": r"\b(leadership|lead|managed\s+a\s+team|mentored)\b"},
    "problem solving": {"canonical": "Problem Solving", "category": SkillCategory.SOFT_SKILL, "regex": r"\b(problem\s+solving|critical\s+thinking)\b"},

    # Domain Knowledge
    "machine learning": {"canonical": "Machine Learning", "category": SkillCategory.DOMAIN_KNOWLEDGE, "regex": r"\b(machine\s+learning|deep\s+learning|ai|ml)\b"},
    "fintech": {"canonical": "FinTech", "category": SkillCategory.DOMAIN_KNOWLEDGE, "regex": r"\b(fintech|payments|banking|financial\s+systems)\b"},
    "cybersecurity": {"canonical": "Cybersecurity", "category": SkillCategory.DOMAIN_KNOWLEDGE, "regex": r"\b(cybersecurity|security|infosec|penetration\s+testing)\b"},
}

# Prompt injection patterns to neutralize untrusted input instructions
INJECTION_PATTERNS = [
    r"(ignore|disregard|bypass)\s+(all\s+)?(previous|prior|system)\s+instructions[^\.\n]*",
    r"you\s+are\s+now\s+an?\s+unrestricted[^\.\n]*",
    r"system\s*(override|prompt|directive)[^\.\n]*",
    r"(give|assign|mark)\s+this\s+candidate[^\.\n]*",
    r"state\s+(they|he|she)\s+have[^\.\n]*",
    r"disregard\s+the\s+above[^\.\n]*",
    r"(jailbreak|developer\s+mode|dan\s+mode)[^\.\n]*",
]


class DeterministicFallbackProvider:
    """
    Deterministic rule-based extractor.
    Operates without internet or external AI API.
    """

    def __init__(self):
        self.version = "1.0.0-deterministic-fallback"

    def clean_untrusted_input(self, text: str) -> Tuple[str, List[str]]:
        """Sanitizes text and warns if prompt injection attempt is detected."""
        warnings = []
        cleaned_lines = []
        for line in text.splitlines():
            line_has_injection = False
            for pattern in INJECTION_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    warnings.append(f"Untrusted directive pattern detected and ignored: '{pattern}'")
                    line_has_injection = True
                    break
            if not line_has_injection:
                cleaned_lines.append(line)
        cleaned = "\n".join(cleaned_lines)
        return cleaned, warnings

    def extract_employee_profile(self, text: str) -> EmployeeExtractionEnvelope:
        start_time = datetime.datetime.now()
        cleaned_text, warnings = self.clean_untrusted_input(text)

        lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]

        # 1. Candidate Name (usually first prominent non-header line)
        full_name = None
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 4 and not any(kw in first_line.lower() for kw in ["resume", "curriculum", "profile", "cv"]):
                full_name = first_line

        # 2. Segment text into sections
        sections = self._segment_resume(cleaned_text)

        # 3. Extract skills with explicit evidence checks
        extracted_skills = self._extract_skills_with_evidence(sections)

        # 4. Extract experience years
        total_exp = self._estimate_experience_years(cleaned_text)

        # 5. Extract certifications
        certs = self._extract_certifications(sections.get("certifications", ""))

        # 6. Current Title
        current_title = self._extract_title(cleaned_text)

        # 7. Summary
        summary = self._extract_summary(sections.get("summary", ""), cleaned_text)

        elapsed_ms = (datetime.datetime.now() - start_time).total_seconds() * 1000.0

        profile = EmployeeProfile(
            full_name=full_name,
            current_title=current_title,
            total_years_experience=total_exp,
            skills=extracted_skills,
            certifications=certs,
            summary=summary,
        )

        metadata = ExtractionMetadata(
            provider="deterministic_fallback",
            model_version=self.version,
            mode="deterministic_fallback",
            latency_ms=round(elapsed_ms, 2),
            warnings=warnings,
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        )

        return EmployeeExtractionEnvelope(data=profile, metadata=metadata)

    def extract_project_requirements(self, text: str) -> ProjectExtractionEnvelope:
        start_time = datetime.datetime.now()
        cleaned_text, warnings = self.clean_untrusted_input(text)

        lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]

        title = "Untitled Project"
        if lines:
            title = lines[0]

        # Extract domain
        domain = self._detect_domain(cleaned_text)

        # Extract target team size
        team_size = self._extract_team_size(cleaned_text)

        # Extract required skills and weights
        required_skills = self._extract_project_skills(cleaned_text)

        elapsed_ms = (datetime.datetime.now() - start_time).total_seconds() * 1000.0

        project = ProjectRequirement(
            title=title,
            description=cleaned_text[:500].strip(),
            domain=domain,
            target_team_size=team_size,
            required_skills=required_skills,
        )

        metadata = ExtractionMetadata(
            provider="deterministic_fallback",
            model_version=self.version,
            mode="deterministic_fallback",
            latency_ms=round(elapsed_ms, 2),
            warnings=warnings,
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        )

        return ProjectExtractionEnvelope(data=project, metadata=metadata)

    # Internal parsing helpers
    def _segment_resume(self, text: str) -> Dict[str, str]:
        sections: Dict[str, List[str]] = {
            "summary": [],
            "experience": [],
            "projects": [],
            "skills": [],
            "certifications": [],
            "other": [],
        }

        current_section = "other"
        for line in text.splitlines():
            line_clean = line.strip().lower()
            if any(h in line_clean for h in ["summary", "profile", "about me", "objective"]):
                current_section = "summary"
            elif any(h in line_clean for h in ["experience", "work history", "employment", "professional background"]):
                current_section = "experience"
            elif any(h in line_clean for h in ["project", "key initiatives", "portfolio"]):
                current_section = "projects"
            elif any(h in line_clean for h in ["skills", "technical proficiencies", "technologies", "competencies"]):
                current_section = "skills"
            elif any(h in line_clean for h in ["certification", "licenses", "credentials"]):
                current_section = "certifications"
            elif any(h in line_clean for h in ["education", "academic"]):
                current_section = "other"
            else:
                sections[current_section].append(line)

        return {k: "\n".join(v) for k, v in sections.items()}

    def _extract_skills_with_evidence(self, sections: Dict[str, str]) -> List[ExtractedSkill]:
        extracted: Dict[str, ExtractedSkill] = {}

        evidence_text = sections.get("experience", "") + "\n" + sections.get("projects", "")
        evidence_sentences = re.split(r"(?<=[.!?\n])\s+", evidence_text)

        skills_list_text = sections.get("skills", "")

        for key, info in SKILL_TAXONOMY.items():
            pattern = info["regex"]
            canonical = info["canonical"]
            category = info["category"]

            # First check evidence sentences in Experience/Projects
            found_evidence = None
            for sent in evidence_sentences:
                clean_sent = sent.strip()
                if len(clean_sent) > 15 and re.search(pattern, clean_sent, re.IGNORECASE):
                    found_evidence = clean_sent
                    break

            if found_evidence:
                extracted[canonical] = ExtractedSkill(
                    name=canonical,
                    category=category,
                    proficiency=self._estimate_proficiency(found_evidence),
                    years_of_experience=None,
                    verification_status=VerificationStatus.VERIFIED,
                    evidence=found_evidence,
                    confidence_score=0.90,
                )
            elif re.search(pattern, skills_list_text, re.IGNORECASE):
                # Mentioned in skills section without verifiable project/experience context
                extracted[canonical] = ExtractedSkill(
                    name=canonical,
                    category=category,
                    proficiency=ProficiencyLevel.INTERMEDIATE,
                    years_of_experience=None,
                    verification_status=VerificationStatus.UNVERIFIED,
                    evidence=None,
                    confidence_score=0.50,
                )
            elif re.search(pattern, sections.get("other", ""), re.IGNORECASE):
                # Mentioned vaguely in other text
                extracted[canonical] = ExtractedSkill(
                    name=canonical,
                    category=category,
                    proficiency=ProficiencyLevel.BEGINNER,
                    years_of_experience=None,
                    verification_status=VerificationStatus.UNKNOWN,
                    evidence=None,
                    confidence_score=0.35,
                )

        return list(extracted.values())

    def _estimate_proficiency(self, evidence: str) -> ProficiencyLevel:
        evidence_lower = evidence.lower()
        if any(w in evidence_lower for w in ["led", "architected", "senior", "lead", "designed", "optimized", "expert", "5+ years", "10+ years"]):
            return ProficiencyLevel.EXPERT
        if any(w in evidence_lower for w in ["developed", "built", "implemented", "created", "production", "engineered"]):
            return ProficiencyLevel.ADVANCED
        if any(w in evidence_lower for w in ["assisted", "learned", "junior", "intern", "supported"]):
            return ProficiencyLevel.BEGINNER
        return ProficiencyLevel.INTERMEDIATE

    def _estimate_experience_years(self, text: str) -> Optional[float]:
        # Look for explicit statements like "X+ years of experience"
        m = re.search(r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s*(?:of\s*)?experience", text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass

        # Look for calendar years range, e.g. 2019 - 2024 or 2018 - Present
        year_matches = [int(y) for y in re.findall(r"\b(20\d\d|19\d\d)\b", text)]
        if len(year_matches) >= 2:
            min_y = min(year_matches)
            max_y = max(year_matches)
            diff = max_y - min_y
            if 0 < diff <= 45:
                return float(diff)
        return None

    def _extract_certifications(self, text: str) -> List[str]:
        certs = []
        known_cert_patterns = [
            (r"aws\s+certified[^\.\n,]*", "AWS Certified Solutions Architect"),
            (r"certified\s+kubernetes\s+administrator|cka", "Certified Kubernetes Administrator (CKA)"),
            (r"pmp|project\s+management\s+professional", "Project Management Professional (PMP)"),
            (r"terraform\s+associate", "HashiCorp Certified: Terraform Associate"),
            (r"azure\s+solutions\s+architect", "Microsoft Certified: Azure Solutions Architect"),
            (r"gcp\s+professional\s+cloud\s+architect", "Google Cloud Certified: Professional Cloud Architect"),
        ]
        for pat, cert_name in known_cert_patterns:
            if re.search(pat, text, re.IGNORECASE):
                certs.append(cert_name)
        return certs

    def _extract_title(self, text: str) -> Optional[str]:
        titles = [
            "Senior Software Engineer",
            "Software Engineer",
            "Lead AI Engineer",
            "Machine Learning Engineer",
            "Full Stack Developer",
            "DevOps Engineer",
            "Frontend Engineer",
            "Backend Engineer",
            "Data Scientist",
            "Cloud Solutions Architect",
        ]
        for t in titles:
            if re.search(rf"\b{re.escape(t)}\b", text, re.IGNORECASE):
                return t
        return None

    def _extract_summary(self, summary_section: str, full_text: str) -> Optional[str]:
        if summary_section.strip():
            lines = [l.strip() for l in summary_section.splitlines() if l.strip()]
            return " ".join(lines[:3]) if lines else None

        # Fallback to first paragraph under header
        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        if len(paragraphs) > 1 and len(paragraphs[1]) > 40:
            return paragraphs[1][:300]
        return None

    def _detect_domain(self, text: str) -> Optional[str]:
        domains = {
            "FinTech": r"\b(fintech|payments|banking|fraud|trading|cryptocurrency)\b",
            "Healthcare": r"\b(health|patient|clinical|hipaa|medical|telehealth)\b",
            "E-Commerce": r"\b(e-commerce|retail|cart|checkout|store)\b",
            "Cybersecurity": r"\b(cybersecurity|infosec|security|soc|penetration)\b",
            "Artificial Intelligence": r"\b(ai|llm|agentic|machine\s+learning|nlp)\b",
        }
        for d_name, pat in domains.items():
            if re.search(pat, text, re.IGNORECASE):
                return d_name
        return "General Technology"

    def _extract_team_size(self, text: str) -> Optional[int]:
        m = re.search(r"team\s*(?:size)?\s*(?:of|:)?\s*(\d+)", text, re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                pass
        return 3

    def _extract_project_skills(self, text: str) -> List[ProjectSkillRequirement]:
        skills = []
        is_in_preferred_section = False

        for line in text.splitlines():
            line_clean = line.strip()
            line_lower = line_clean.lower()
            if not line_clean:
                continue

            if any(h in line_lower for h in ["preferred", "nice to have", "optional", "bonus", "good to have"]):
                is_in_preferred_section = True
            elif any(h in line_lower for h in ["must have", "required", "requirements", "core skills", "essential"]):
                is_in_preferred_section = False

            for key, info in SKILL_TAXONOMY.items():
                pattern = info["regex"]
                canonical = info["canonical"]

                if any(s.name == canonical for s in skills):
                    continue

                if re.search(pattern, line_clean, re.IGNORECASE):
                    is_mandatory = not (
                        is_in_preferred_section
                        or any(w in line_lower for w in ["nice to have", "plus", "optional", "bonus", "preferred", "helpful"])
                    )

                    weight = 2.0
                    if any(w in line_lower for w in ["must have", "crucial", "essential", "primary", "core", "required"]):
                        weight = 3.0
                    elif not is_mandatory:
                        weight = 1.0

                    proficiency = ProficiencyLevel.INTERMEDIATE
                    if any(w in line_lower for w in ["expert", "lead", "advanced", "5+ years", "deep"]):
                        proficiency = ProficiencyLevel.ADVANCED
                    elif any(w in line_lower for w in ["junior", "basic", "familiarity", "helpful"]):
                        proficiency = ProficiencyLevel.BEGINNER

                    skills.append(
                        ProjectSkillRequirement(
                            name=canonical,
                            minimum_proficiency=proficiency,
                            is_mandatory=is_mandatory,
                            weight=weight,
                        )
                    )
        return skills
