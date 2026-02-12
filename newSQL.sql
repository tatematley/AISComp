CREATE TABLE candidate_status (
    candidate_status INTEGER PRIMARY KEY,
    candidate_status_description TEXT NOT NULL
);

INSERT INTO candidate_status (candidate_status, candidate_status_description)
VALUES
    (0, 'rejected'),
    (1, 'pending interview'),
    (2, 'interviewed'),
    (3, 'hired');


ALTER TABLE candidate
ADD COLUMN current_candidate BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN candidate_status INTEGER;


INSERT INTO candidate (
    candidate_id,
    currentRole,
    department_id,
    location_id,
    years_exp,
    availability_hours,
    education_level_id,
    start_date,
    current_candidate,
    candidate_status
)
VALUES
(116, 'Business Analyst', 3, 1, 4, 40, 4, '2026-02-12', FALSE, 3),
(117, 'Marketing Analyst', 5, 1, 5, 40, 4, '2026-01-25', FALSE, 3),
(118, 'Data Engineer', 3, 2, 3, 40, 4, '2026-02-01', FALSE, 0),
(119, 'HR Operations Specialist', 6, 3, 3, 40, 4, '2026-02-12', FALSE, 0),
(120, 'ML Engineer', 1, 1, 4, 35, 3, '2026-03-01', FALSE, 3),
(121, 'Product Analyst', 7, 2, 3, 20, 3, '2026-03-01', FALSE, 0),
(122, 'Junior Data Analyst', 1, 2, 3, 40, 3, '2026-01-25', FALSE, 3),
(123, 'Security Analyst', 2, 2, 4, 40, 3, '2026-02-12', FALSE, 0),
(124, 'Project Manager', 2, 1, 4, 40, 4, '2026-03-20', FALSE, 3);



INSERT INTO candidate_skill (
    candidate_skill_id,
    candidate_id,
    skill_id,
    proficiency_level
)
VALUES
(150, 116, 1, 3),
(151, 116, 2, 3),
(152, 116, 7, 4),
(153, 116, 22, 4),
(154, 116, 34, 2),
(155, 116, 32, 3),
(156, 116, 44, 4),
(157, 116, 45, 2),
(158, 116, 49, 3),
(159, 116, 43, 4),
(160, 117, 55, 2),
(161, 117, 3, 3),
(162, 117, 1, 4),
(163, 117, 2, 5),
(164, 117, 10, 5),
(165, 117, 6, 5),
(166, 117, 24, 4),
(167, 117, 44, 3),
(168, 117, 28, 3),
(169, 117, 47, 3),
(170, 118, 1, 4),
(171, 118, 2, 2),
(172, 118, 3, 3),
(173, 118, 7, 4),
(174, 118, 19, 3),
(175, 118, 22, 2),
(176, 118, 23, 2),
(177, 118, 44, 3),
(178, 118, 45, 3),
(179, 118, 9, 4),
(180, 119, 16, 4),
(181, 119, 17, 4),
(182, 119, 18, 3),
(183, 119, 1, 4),
(184, 119, 2, 3),
(185, 119, 15, 4),
(186, 119, 14, 4),
(187, 119, 25, 4),
(188, 119, 31, 4),
(189, 119, 12, 5),
(190, 120, 11, 4),
(191, 120, 9, 4),
(192, 120, 14, 3),
(193, 120, 13, 2),
(194, 120, 15, 3),
(195, 120, 29, 4),
(196, 120, 27, 3),
(197, 120, 1, 2),
(198, 120, 31, 2),
(199, 120, 25, 3),
(200, 121, 26, 3),
(201, 121, 27, 3),
(202, 121, 29, 4),
(203, 121, 30, 4),
(204, 121, 31, 5),
(205, 121, 14, 4),
(206, 121, 13, 4),
(207, 121, 12, 4),
(208, 121, 52, 4),
(209, 121, 19, 3),
(210, 122, 20, 4),
(211, 122, 21, 4),
(212, 122, 22, 3),
(213, 122, 23, 4),
(214, 122, 44, 4),
(215, 122, 45, 3),
(216, 122, 3, 3),
(217, 122, 1, 5),
(218, 122, 24, 5),
(219, 122, 22, 4),
(220, 123, 35, 3),
(221, 123, 32, 5),
(222, 123, 33, 3),
(223, 123, 34, 3),
(224, 123, 41, 4),
(225, 123, 44, 2),
(226, 123, 45, 2),
(227, 123, 23, 2),
(228, 123, 7, 3),
(229, 123, 32, 3),
(230, 124, 33, 4),
(231, 124, 34, 4),
(232, 124, 35, 5),
(233, 124, 38, 4),
(234, 124, 41, 3),
(235, 124, 44, 3),
(236, 124, 45, 4),
(237, 124, 46, 4),
(238, 124, 21, 3),
(239, 124, 32, 3)
ON CONFLICT (candidate_skill_id) DO NOTHING;



INSERT INTO candidate_information (
    candidate_id,
    name,
    profile_photo,
    date_of_birth,
    age,
    position,
    email,
    phone_number,
    internal,
    pronouns_id,
    application_date
)
VALUES
(116, 'Jane Pinnock', 'jane_pinnock.png', '2002-02-11', 23, 'Business Analyst', 'jane.pinnock@email.com', '555-0116', TRUE, 2, NULL),
(117, 'Tessa Meredith', 'tessa_meredith.png', '1999-09-08', 26, 'Marketing Analyst', 'tessa.meredith@email.com', '555-0117', TRUE, 2, NULL),
(118, 'Kimball Moffat', 'kimball_moffat.png', '1980-08-22', 45, 'Data Engineer', 'kimball.moffat@email.com', '555-0118', TRUE, 1, NULL),
(119, 'Ryan Nord', 'ryan_nord.png', '2000-03-09', 25, 'HR Operations Specialist', 'ryan.nord@email.com', '555-0119', TRUE, 1, NULL),
(120, 'Abigail Wallace', 'abigail_wallace.png', '1999-04-07', 26, 'ML Engineer', 'abigail.wallace@email.com', '555-0120', TRUE, 2, NULL),
(121, 'Sarah McFadyen', 'sarah_mcfadyen.png', '1998-02-11', 27, 'Product Analyst', 'sarah.mcfadyen@email.com', '555-0121', TRUE, 2, NULL),
(122, 'Nelson Nduwimana', 'nelson_nduwimana.png', '1996-09-11', 29, 'Junior Data Analyst', 'nelson.nduwimana@email.com', '555-0122', TRUE, 1, NULL),
(123, 'Stella Atosha', 'stella_atosha.png', '1999-01-06', 27, 'Security Analyst', 'stella.atosha@email.com', '555-0123', TRUE, 2, NULL),
(124, 'Ellise Hansen', 'ellise_hansen.png', '1994-04-01', 31, 'Project Manager', 'ellise.hansen@email.com', '555-0124', TRUE, 2, NULL);


INSERT INTO internal_candidate (
    candidate_id,
    pip,
    tenure,
    performance_rating
)
VALUES
(116, FALSE, 6.0, 4),
(117, FALSE, 4.2, 4),
(118, FALSE, 7.0, 5),
(119, FALSE, 3.0, 4),
(120, TRUE, 3.5, 2),
(121, FALSE, 2.4, 3),
(122, FALSE, 6.3, 4),
(123, FALSE, 1.8, 5),
(124, FALSE, 3.0, 5);


ALTER TABLE job
ADD COLUMN job_group CHAR(1);


UPDATE job
SET job_group = CASE job_id
    WHEN 201 THEN 'P'
    WHEN 202 THEN 'P'
    WHEN 203 THEN 'P'
    WHEN 204 THEN 'P'
    WHEN 205 THEN 'P'
    WHEN 206 THEN 'P'
    WHEN 207 THEN 'P'
    WHEN 208 THEN 'M'
    WHEN 209 THEN 'P'
    WHEN 210 THEN 'P'
    WHEN 211 THEN 'M'
    WHEN 212 THEN 'M'
    WHEN 213 THEN 'M'
    WHEN 214 THEN 'S'
    WHEN 215 THEN 'P'
    WHEN 216 THEN 'P'
    WHEN 217 THEN 'P'
    WHEN 218 THEN 'P'
    WHEN 219 THEN 'P'
    WHEN 220 THEN 'P'
    WHEN 221 THEN 'P'
    WHEN 222 THEN 'S'
    WHEN 223 THEN 'S'
    WHEN 224 THEN 'S'
END;


ALTER TABLE job
ALTER COLUMN job_group SET NOT NULL;