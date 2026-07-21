# Excluded platform-era runtime

This directory preserves the superseded identity SDK, callback controllers,
layouts, browser adapters, and generated bundles for historical comparison.
It is excluded by `.dockerignore`, is not copied by the runtime Dockerfile, and
is outside Apache's `public/` document root.

Nothing in this directory is part of the standalone application. Do not restore
these files to active controller, library, view, or public-asset paths.
