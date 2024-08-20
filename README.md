# hadesBuild
This repository is used to build the assets (fec and bootstrap.zip) required for hades deployments

scripts:
-git run init 
-git run build
-git run package
-git run clean

init:
    -Init script stages the environment
    -Downloads: (packages and repos)
        -npm i
        -download erasure fec
        -download hades public repo

build:
    -Builds the fec erasure Lambda code and generates a package
    -Uses esbuild to build the Lambda bootstrap function required for cerberus integration

package:
    -generates an 'assets/' folder with artifats generated in <build> (fec and bootstrap.zip)
    -deletes old 'hades/assets' and replaces it with new './assets'
    -changes are commited in the hades repo and it is pushed up
        
clean:
    -destructs the environment by deleting folders and repos 
    -Folders Deleted: node_modules, dist, assets 
    -Repos Deleted: erasure, hades

Run:
    #git run init 
    #git run build
    #git run package
    #git run clean

