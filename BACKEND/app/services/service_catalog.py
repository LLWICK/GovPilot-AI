from dataclasses import dataclass


@dataclass(frozen=True)
class ServiceDefinition:
    service_id: str
    service_name: str
    agency_name: str
    steps: tuple[str, ...]


SERVICES: dict[str, ServiceDefinition] = {
    "general-dispatcher": ServiceDefinition(
        service_id="general-dispatcher",
        service_name="GovPilot AI Central Dispatcher",
        agency_name="Government of Sri Lanka",
        steps=(
            "State Citizen Request",
            "Identify Government Service",
            "Generate Official Guidance",
        ),
    ),
    "passport-renewal": ServiceDefinition(
        service_id="passport-renewal",
        service_name="Passport Renewal",
        agency_name="Department of Immigration and Emigration",
        steps=(
            "Identify Requirements",
            "Prepare Documents",
            "Review Application Guidance",
        ),
    ),
    "nic-application": ServiceDefinition(
        service_id="nic-application",
        service_name="National Identity Card Application",
        agency_name="Department for Registration of Persons",
        steps=(
            "Identify Requirements",
            "Prepare Documents",
            "Review Application Guidance",
        ),
    ),
    "birth-cert-copy": ServiceDefinition(
        service_id="birth-cert-copy",
        service_name="Birth Certificate Copy Request",
        agency_name="Registrar General's Department",
        steps=(
            "Identify Record",
            "Prepare Request Details",
            "Review Application Guidance",
        ),
    ),
}


def get_service(service_id: str | None) -> ServiceDefinition:
    selected = service_id or "general-dispatcher"
    if selected not in SERVICES:
        raise KeyError(selected)
    return SERVICES[selected]
