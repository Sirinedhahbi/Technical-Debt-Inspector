from sqlalchemy import (
    Boolean, CHAR, Column, ForeignKey, Integer,
    Numeric, String, TIMESTAMP, text, JSON
)
from sqlalchemy.orm import relationship
from database import Base


class Utilisateur(Base):
    __tablename__ = "utilisateur"

    id_user = Column(Integer, primary_key=True, autoincrement=True)
    nom_utilisateur = Column(String(255))
    email = Column(String(255), unique=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)

    projets = relationship("Projet", back_populates="utilisateur", cascade="all, delete")


class Projet(Base):
    __tablename__ = "projet"

    id_projet = Column(Integer, primary_key=True, autoincrement=True)
    id_user = Column(Integer, ForeignKey("utilisateur.id_user", ondelete="CASCADE"))
    nom_projet = Column(String(255), nullable=False)
    url_projet = Column(String(255), nullable=False)
    H_Value = Column(Numeric(5, 2))
    K_Value = Column(Numeric(5, 2))

    utilisateur = relationship("Utilisateur", back_populates="projets")
    branches = relationship("Branche", back_populates="projet", cascade="all, delete")


class Branche(Base):
    __tablename__ = "branche"
    id_branche = Column(Integer, primary_key=True, autoincrement=True)
    id_projet = Column(Integer, ForeignKey("projet.id_projet", ondelete="CASCADE"))
    nom_branche = Column(String(100), nullable=False)
    sonar_project_key = Column(String(255), unique=True)

    projet = relationship("Projet", back_populates="branches")
    resultats_push = relationship("ResultatPush", back_populates="branche", cascade="all, delete")


class ResultatPush(Base):
    __tablename__ = "resultat_push"

    # Identifiants et métadonnées du push
    id_push = Column(String(60), primary_key=True)
    id_branche = Column(Integer, ForeignKey("branche.id_branche", ondelete="CASCADE"))
    date_push = Column(TIMESTAMP, server_default=text("NOW()"))

    # Ratings
    reliability_rating = Column(CHAR(1))
    security_rating = Column(CHAR(1))
    maintainability_rating = Column(CHAR(1))

    # Reliability
    bugs = Column(Integer)
    reliability_remediation_effort = Column(Integer)

    # Security
    vulnerabilities = Column(Integer)
    security_remediation_effort = Column(Integer)
    security_hotspots = Column(Integer)
    security_hotspots_reviewed = Column(Numeric(5, 2))

    # Maintainability
    code_smells = Column(Integer)
    sqale_index = Column(Integer)
    effort_to_reach_maintainability_rating_a = Column(Integer)
    sqale_debt_ratio = Column(Numeric(5, 2))

    # Complexity
    complexity = Column(Integer)
    cognitive_complexity = Column(Integer)
    class_complexity = Column(Numeric(10, 2))
    file_complexity = Column(Numeric(10, 2))
    function_complexity = Column(Numeric(10, 2))

    # Size
    lines = Column(Integer)
    ncloc = Column(Integer)
    comment_lines = Column(Integer)
    comment_lines_density = Column(Numeric(5, 2))
    directories = Column(Integer)
    files = Column(Integer)
    classes = Column(Integer)

    # Duplication
    duplicated_lines = Column(Integer)
    duplicated_lines_density = Column(Numeric(5, 2))
    duplicated_blocks = Column(Integer)
    duplicated_files = Column(Integer)

    # Tests / Coverage
    tests = Column(Integer)
    coverage = Column(Numeric(5, 2))
    uncovered_lines = Column(Integer)
    uncovered_conditions = Column(Integer)
    test_success_density = Column(Numeric(5, 2))
    skipped_tests = Column(Integer)
    test_failures = Column(Integer)
    test_errors = Column(Integer)
    test_execution_time = Column(Integer)

    new_technical_debt = Column(Integer)
    new_reliability_remediation_effort = Column(Integer)
    new_security_remediation_effort = Column(Integer)
    top_debt_files = Column(String(2000))
    #le CUSUM
    Somme = Column(Numeric(12, 4))
    somme_dis = Column(Numeric(12, 4))# CUSUM peut dépasser 999.99, Numeric(5,2) insuffisant


    branche = relationship("Branche", back_populates="resultats_push")