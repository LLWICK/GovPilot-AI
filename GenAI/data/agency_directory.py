# data/form_directory.py

FORM_DIRECTORY = {
    "national_identity_card": {
        "agency_name": "Department for Registration of Persons",
        "url": "https://drp.gov.lk/en/normal.php",
        "relevance_reason": "Official page listing NIC application requirements and forms",
        "scrapable": True,  # confirmed static HTML, tested and working
    },
    "birth_certificate_copies": {
        "agency_name": "Registrar General's Department",
        "url": "https://www.rgd.gov.lk/web/index.php/en/e-services/e-bmd/request-certified-copies-of-birth-marriage-and-death-certificates-online",
        "relevance_reason": "Official page for requesting copies of certified birth certificates in Sri Lanka",
        "scrapable": True,
    },
    "new_birth_certificate_registration": {
        "agency_name": "Registrar General's Department",
        "url": "https://www.rgd.gov.lk/web/index.php/en/services/civil-registration/birth/registration-of-unregistered-birth",
        "relevance_reason": "Official page for registering an unregistered birth",
        "scrapable": True,
    },
    "business_registration": {
        "agency_name": "Department of the Registrar of Companies",
        "url": "https://drc.gov.lk/en/?page_id=2741",
        "relevance_reason": "Official page for business registration information",
        "scrapable": True,  # note: full incorporation forms are behind eROC login — RA should report requires_login for those cases
    },
    "passport_application": {
        "agency_name": "Department of Immigration and Emigration",
        "url": "https://eservices.immigration.gov.lk/onlinetd/OnlineTD/",
        "relevance_reason": "Online passport application portal",
        "scrapable": True,  # this one is an online_portal case, not a downloadable form — RA already handles this distinction
    },

    "driving_license": {
        "agency_name": "Department of Motor Traffic",
        "url": "https://dmt.gov.lk/index.php?lang=en",
        "relevance_reason": "Official site of Department of Motor Traffic Sri Lanka and can use for obtaining new driving license and vehicle license in Sri Lanka",
        "scrapable": True,  # this one is an online_portal case, not a downloadable form — RA already handles this distinction
    },
    # add more entries as you test and confirm them
}