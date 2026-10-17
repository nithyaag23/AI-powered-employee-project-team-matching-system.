"""
Unit tests for the Deterministic Fallback Provider.
Verifies offline parsing, skill taxonomy detection, verbatim evidence capture,
and explicit UNVERIFIED state assignment for skills in buzzword lists.
"""

import pytest
from backend.ai.fallback import DeterministicFallbackProvider
from backend.ai.schemas import VerificationStatus, ProficiencyLevel

SAMPLE_RESUME = """
Jane Doe
Senior Software Engineer
San Francisco, CA

Professional Summary:
Passionate backend engineer with 6 years of experience building high-scale distributed systems and cloud services.

Professional Experience:
CloudTech Inc. | 2021 - 2024
- Engineered backend payment processing microservices using Python and FastAPI handling 15,000 transactions/minute.
- Built automated deployment pipelines using Docker and deployed containerized services to AWS ECS.
- Designed relational database schemas and optimized complex queries in PostgreSQL, improving query response time by 40%.

DataCorp | 2018 - 2021
- Developed real-time streaming data ingestion workers using Go and Redis.

Technical Proficiencies:
Languages & Frameworks: Python, Go, TypeScript, FastAPI, React, Django
Databases & Cloud: PostgreSQL, Redis, MongoDB, AWS, Docker, Kubernetes

Certifications:
- AWS Certified Solutions Architect - Associate
- Certified Kubernetes Administrator (CKA)
"""

SAMPLE_PROJECT = """
Real-Time Payments Gateway

We are looking for a team of 4 engineers to design and deploy our next-generation FinTech transaction engine.
The system will process high-frequency payment transactions with sub-50ms latency.

Must have requirements:
- Deep expertise in Go (Golang) for high-performance transaction pipelines.
- Production experience with PostgreSQL for ACID compliance and ledger transactions.
- Solid hands-on knowledge of Docker containerization.

Preferred / Nice to have:
- Experience with Redis caching is a strong plus.
- Familiarity with React for internal administrative monitoring dashboards is helpful.
"""


def test_fallback_extract_employee_profile():
    provider = DeterministicFallbackProvider()
    envelope = provider.extract_employee_profile(SAMPLE_RESUME)

    assert envelope.metadata.mode == "deterministic_fallback"
    assert envelope.metadata.provider == "deterministic_fallback"
    assert envelope.metadata.latency_ms >= 0.0

    profile = envelope.data
    assert profile.full_name == "Jane Doe"
    assert profile.current_title == "Senior Software Engineer"
    assert profile.total_years_experience == 6.0

    # Check verified skills (mentioned in work experience bullets)
    skills_by_name = {s.name: s for s in profile.skills}

    assert "Python" in skills_by_name
    python_skill = skills_by_name["Python"]
    assert python_skill.verification_status == VerificationStatus.VERIFIED
    assert python_skill.evidence is not None
    assert "FastAPI" in python_skill.evidence or "Python" in python_skill.evidence
    assert python_skill.confidence_score >= 0.85

    assert "Docker" in skills_by_name
    docker_skill = skills_by_name["Docker"]
    assert docker_skill.verification_status == VerificationStatus.VERIFIED
    assert docker_skill.evidence is not None

    assert "PostgreSQL" in skills_by_name
    postgres_skill = skills_by_name["PostgreSQL"]
    assert postgres_skill.verification_status == VerificationStatus.VERIFIED

    # Check unverified skills (listed only in Technical Proficiencies without bullet evidence)
    assert "MongoDB" in skills_by_name
    mongo_skill = skills_by_name["MongoDB"]
    assert mongo_skill.verification_status == VerificationStatus.UNVERIFIED
    assert mongo_skill.evidence is None
    assert mongo_skill.confidence_score == 0.50

    assert "Kubernetes" in skills_by_name
    k8s_skill = skills_by_name["Kubernetes"]
    assert k8s_skill.verification_status == VerificationStatus.UNVERIFIED
    assert k8s_skill.evidence is None

    # Check certifications
    assert len(profile.certifications) >= 1
    assert any("AWS" in c for c in profile.certifications)


def test_fallback_extract_project_requirements():
    provider = DeterministicFallbackProvider()
    envelope = provider.extract_project_requirements(SAMPLE_PROJECT)

    assert envelope.metadata.mode == "deterministic_fallback"
    project = envelope.data

    assert project.title == "Real-Time Payments Gateway"
    assert project.domain == "FinTech"
    assert project.target_team_size == 4

    skills_dict = {s.name: s for s in project.required_skills}

    # Go and PostgreSQL are mandatory must-haves
    assert "Go" in skills_dict
    assert skills_dict["Go"].is_mandatory is True
    assert skills_dict["Go"].weight >= 2.0

    assert "PostgreSQL" in skills_dict
    assert skills_dict["PostgreSQL"].is_mandatory is True

    # React and Redis are preferred / nice-to-haves
    if "Redis" in skills_dict:
        assert skills_dict["Redis"].is_mandatory is False
        assert skills_dict["Redis"].weight <= 2.0

    if "React" in skills_dict:
        assert skills_dict["React"].is_mandatory is False
