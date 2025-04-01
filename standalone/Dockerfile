ARG PARENT_IMAGE=openmicroscopy/omero-web:latest
FROM ${PARENT_IMAGE}
LABEL maintainer="ome-devel@lists.openmicroscopy.org.uk"

USER root

RUN mkdir /sites

# Install additional OMERO.web plugins and dependencies
RUN /opt/omero/web/venv3/bin/pip install \
        omero-figure \
        omero-iviewer \
        omero-fpbioimage \
        omero-mapr \
        omero-parade \
        omero-autotag \
        omero-tagsearch \
        omero-gallery \
        whitenoise


# Add default webapps configuration
ADD 01-default-webapps.omero /opt/omero/web/config/

USER omero-web